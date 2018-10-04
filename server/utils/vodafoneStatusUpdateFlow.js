// 
const moment = require('moment');
const pubnubWrapper = new(require('../utils/pubnubWrapper'))();

function vodafoneStatusUpdate(request, activityCommonService, objectCollection) {
    // If activity_status_id is being set to 'Feasibility Check', automatically assign
    // the add Feasibility Checker as a participant

    global.logger.write('debug', 'Inside vodafoneStatusUpdate...', {}, request);

    const util = objectCollection.util;
    const cacheWrapper = objectCollection.cacheWrapper;
    const queueWrapper = objectCollection.queueWrapper;
    const activityPushService = objectCollection.activityPushService;

    var activityParticipantCollection = [{
        "access_role_id": 22,
        "account_id": 971,
        "activity_id": request.activity_id,
        "asset_datetime_last_seen": "1970-01-01 00:00:00",
        "asset_first_name": "Feasibility Checker",
        "asset_id": 30998,
        "asset_image_path": "",
        "asset_last_name": "",
        "asset_phone_number": "8790254329",
        "asset_phone_number_code": "91",
        "asset_type_category_id": 3,
        "asset_type_id": 122940,
        "field_id": 0,
        "log_asset_id": request.asset_id,
        "message_unique_id": "307471538376536307668",
        "operating_asset_first_name": "Kapil",
        "organization_id": 856,
        "workforce_id": 5336,
    }];

    request.message_unique_id = util.getMessageUniqueId(request.asset_id);
    request.activity_access_role_id = 22;
    request.activity_participant_collection = JSON.stringify(activityParticipantCollection);

    const event = {
        name: "assignParticipnt",
        service: "activityParticipantService",
        method: "assignCoworker",
        payload: request
    };

    if (Number(request.activity_status_id) === 278416) {
        // Feasibility Check 
        queueWrapper.raiseActivityEvent(event, request.activity_id, (err, resp) => {
            if (err) {
                console.log("\x1b[35m [ERROR] Raising queue activity raised for adding Feasibility Checker as a participant. \x1b[0m")
            } else {
                console.log("\x1b[35m Queue activity raised for adding Feasibility Checker as a participant. \x1b[0m")
            }
        });
    }

    // // Send a PubNub push
    // var pubnubMsg = {};
    // pubnubMsg.type = 'activity_unread';
    // pubnubMsg.organization_id = request.organization_id;
    // pubnubMsg.desk_asset_id = request.asset_id;
    // pubnubMsg.activity_type_category_id = 9;
    // // console.log('PubNub Message : ', pubnubMsg);
    // global.logger.write('debug', 'PubNub Message: ' + JSON.stringify(pubnubMsg, null, 2), {}, request);

    // activityPushService.pubNubPush(request, pubnubMsg, function (err, data) {
    //     global.logger.write('debug', 'PubNub Push sent.', {}, request);
    //     global.logger.write('debug', data, {}, request);
    // });

    //  
    // Variables
    var earliestSourceStatusTimestamp,
        latestTargetStatusTimestamp,
        timeDuration = 0,
        fromStatusId, toStatusId,
        weeklySummaryId, monthlySummaryId,
        activityDateTimeCreated,
        startDateTimeOfWeek, endDateTimeOfWeek,
        startDateTimeOfMonth, endDateTimeOfMonth,
        previousImmediateStatusId;

    // Get the previous immediate status for this activity along with the timestamp at 
    // which the previous status was set
    activityCommonService.activityTimelineTxnSelectActivityStatus(request, request.activity_status_id, 2)
        .then((data) => {
            // console.log("Get the previous immediate status for this activity: ", data);
            // previousImmediateStatusId = Number(data[0].activity_status_id);

            // console.log();
            // console.log('\x1b[35m previousImmediateStatusId: \x1b[0m', previousImmediateStatusId);
            // console.log();

            // Check if there any status based rules created for the combination of the 
            // form_id and the target status set on the form and rerieve all the rules 
            // that apply along with the corresponding summary ids for weekly and monthly 
            // summaries
            activityCommonService.activityStatusValidationMappingSelectTrigger(request, (err, data) => {
                // For each rule, determine the source status and target status (activity_status_id) 
                // from the rule. Check whether the source and target status (activity_status_id) are 
                // the same
                data.forEach(rule => {
                    fromStatusId = Number(rule.from_activity_status_id);
                    toStatusId = Number(rule.to_activity_status_id);
                    console.log('\x1b[35m rule.from_activity_status_id: \x1b[0m', Number(rule.from_activity_status_id));
                    console.log('\x1b[35m rule.to_activity_status_id: \x1b[0m', Number(rule.to_activity_status_id));
                    // If they are not same
                    if (Number(rule.from_activity_status_id) !== Number(rule.to_activity_status_id)) {

                        // console.log('\x1b[35m rule.from_activity_status_id: \x1b[0m', Number(rule.from_activity_status_id));
                        // console.log('\x1b[35m rule.to_activity_status_id: \x1b[0m', Number(rule.to_activity_status_id));
                        global.logger.write('debug', 'rule.from_activity_status_id: ' + JSON.stringify(Number(rule.from_activity_status_id)), {}, request);
                        global.logger.write('debug', 'rule.to_activity_status_id: ' + JSON.stringify(Number(rule.to_activity_status_id)), {}, request);

                        // For this activity, get the EARLIEST most timestamp of the SOURCE status
                        activityCommonService.activityTimelineTxnSelectActivityStatus(request, rule.from_activity_status_id, 0)
                            .then((data) => {
                                // console.log('\x1b[31m For this activity, get the EARLIEST most timestamp of the SOURCE status: \x1b[0m', data);
                                global.logger.write('debug', 'EARLIEST most timestamp data: ' + JSON.stringify(data), {}, request);

                                earliestSourceStatusTimestamp = data[0].timeline_transaction_datetime;
                                console.log('\x1b[31m earliestSourceStatusTimestamp: \x1b[0m', earliestSourceStatusTimestamp);
                                global.logger.write('debug', 'earliestSourceStatusTimestamp: ' + JSON.stringify(earliestSourceStatusTimestamp), {}, request);

                                // For the same activity, get the LATEST timestamp for the TARGET status
                                return activityCommonService.activityTimelineTxnSelectActivityStatus(request, rule.to_activity_status_id, 1)
                                    .then((data) => {
                                        // console.log('\x1b[31m Promise.resolve(data): \x1b[0m', data);
                                        return Promise.resolve(data);
                                    });

                            })
                            .then((data) => {
                                // console.log('\x1b[31m For the same activity, get the LATEST timestamp for the TARGET status: \x1b[0m', data);

                                latestTargetStatusTimestamp = data[0].timeline_transaction_datetime;
                                console.log('\x1b[31m latestTargetStatusTimestamp: \x1b[0m', latestTargetStatusTimestamp);
                                global.logger.write('debug', 'EARLIEST most timestamp data: ' + JSON.stringify(data), {}, request);
                                global.logger.write('debug', 'latestTargetStatusTimestamp: ' + JSON.stringify(latestTargetStatusTimestamp), {}, request);

                                // Determine the time duration for the transition from the earliest source 
                                // status to the latest target status
                                timeDuration = calculateDurationAsSeconds(earliestSourceStatusTimestamp, latestTargetStatusTimestamp);
                                console.log('\x1b[31m timeDuration: \x1b[0m', timeDuration);
                                global.logger.write('debug', 'timeDuration: ' + JSON.stringify(timeDuration), {}, request);

                                return activityCommonService.activityStatusChangeTxnInsert(request, timeDuration, {
                                    from_status_id: Number(rule.from_activity_status_id),
                                    to_status_id: Number(rule.to_activity_status_id),
                                    from_status_datetime: earliestSourceStatusTimestamp,
                                    to_status_datetime: latestTargetStatusTimestamp
                                })
                            })
                            .then((data) => {

                                // Retrieve the corresponding weekly summary id from the rule table
                                weeklySummaryId = Number(rule.weekly_summary_id);
                                console.log('\x1b[31m weeklySummaryId: \x1b[0m', weeklySummaryId);
                                // Retrieve the corresponding monthly summary id from the rule table
                                monthlySummaryId = Number(rule.monthly_summary_id);
                                console.log('\x1b[31m monthlySummaryId: \x1b[0m', monthlySummaryId);

                                // Determine the week that needs to be updated on the basis of the creation 
                                // timestamp of the activity
                                activityCommonService.getActivityDetails(request, 0, (err, data) => {
                                    activityDateTimeCreated = data[0].activity_datetime_created;
                                    console.log();
                                    console.log('\x1b[31m activityDateTimeCreated: \x1b[0m', activityDateTimeCreated);
                                    console.log();

                                    startDateTimeOfWeek = getStartOfWeekForDate(activityDateTimeCreated);
                                    endDateTimeOfWeek = getEndOfWeekForDate(activityDateTimeCreated);

                                    startDateTimeOfMonth = getStartOfMonthForDate(activityDateTimeCreated);
                                    endDateTimeOfMonth = getEndOfMonthForDate(activityDateTimeCreated);

                                    console.log('\x1b[34m startDateTimeOfWeek: \x1b[0m', startDateTimeOfWeek);
                                    console.log('\x1b[34m endDateTimeOfWeek: \x1b[0m', endDateTimeOfWeek);
                                    console.log('\x1b[31m startDateTimeOfMonth: \x1b[0m', startDateTimeOfMonth);
                                    console.log('\x1b[31m endDateTimeOfMonth: \x1b[0m', endDateTimeOfMonth);

                                    // Get the average duration of all the status transitions for the combination of form_id, 
                                    // source status and target status for which the activity creation timestamp lies within 
                                    // the week start timestamp and week end timestamp determined by activity creation timestamp 
                                    // of the current request.
                                    return activityCommonService.activityStatusChangeTxnSelectAverage(request, 2, {
                                            from_status_id: Number(rule.from_activity_status_id),
                                            to_status_id: Number(rule.to_activity_status_id),
                                            datetime_start: startDateTimeOfWeek,
                                            datetime_end: endDateTimeOfWeek
                                        })
                                        .then((data) => {

                                            console.log('\x1b[31m Weekly average_duration: \x1b[0m', data[0].average_duration);
                                            // Weekly Summary Insert/Update
                                            activityCommonService.weeklySummaryInsert(request, {
                                                summary_id: weeklySummaryId,
                                                asset_id: request.asset_id,
                                                entity_tinyint_1: 0,
                                                entity_bigint_1: 0,
                                                entity_double_1: Number(data[0].average_duration),
                                                entity_decimal_1: Number(data[0].average_duration),
                                                entity_decimal_2: 0,
                                                entity_decimal_3: 0,
                                                entity_text_1: '',
                                                entity_text_2: '',
                                                startDateTimeOfWeek: startDateTimeOfWeek,
                                                endDateTimeOfWeek: endDateTimeOfWeek

                                            }).catch(() => {
                                                console.log('\x1b[31m [Error] Weekly Summary Insert/Update: \x1b[0m', err);
                                            });

                                            // Get the average duration of all the status transitions for the combination of form_id, 
                                            // source status and target status for which the activity creation timestamp lies within 
                                            // the month start timestamp and month end timestamp determined by activity creation timestamp 
                                            // of the current request.
                                            return activityCommonService.activityStatusChangeTxnSelectAverage(request, 2, {
                                                from_status_id: Number(rule.from_activity_status_id),
                                                to_status_id: Number(rule.to_activity_status_id),
                                                datetime_start: startDateTimeOfMonth,
                                                datetime_end: endDateTimeOfMonth
                                            })
                                        })
                                        .then((data) => {

                                            console.log('\x1b[31m Monthly average_duration: \x1b[0m', data[0].average_duration);
                                            // Monthly Summary Insert/Update
                                            return activityCommonService.monthlySummaryInsert(request, {
                                                summary_id: monthlySummaryId,
                                                asset_id: request.asset_id,
                                                entity_tinyint_1: 0,
                                                entity_bigint_1: 0,
                                                entity_double_1: Number(data[0].average_duration),
                                                entity_decimal_1: Number(data[0].average_duration),
                                                entity_decimal_2: 0,
                                                entity_decimal_3: 0,
                                                entity_text_1: '',
                                                entity_text_2: '',
                                                startDateTimeOfMonth: startDateTimeOfMonth,
                                                endDateTimeOfMonth: endDateTimeOfMonth

                                            }).catch((err) => {
                                                console.log('\x1b[31m [Error] Monthly Summary Insert/Update: \x1b[0m', err);

                                            });

                                        }).catch((err) => {
                                            console.log('\x1b[31m [Error] | [if block] | from != to: \x1b[0m', err);
                                        });
                                });

                            })

                    } else if (Number(rule.from_activity_status_id) === Number(rule.to_activity_status_id)) {
                        // Check if the previous status and the target status are the same
                        // if (previousImmediateStatusId === Number(request.activity_status_id)) {
                        //     // Determine the duration of the status transition from the previous status to 
                        //     // the current status
                        //     // For this activity, get the EARLIEST most timestamp of the SOURCE status
                        //     activityCommonService.activityTimelineTxnSelectActivityStatus(request, rule.from_activity_status_id, 0)
                        //         .then((data) => {
                        //             earliestSourceStatusTimestamp = data[0].timeline_transaction_datetime;
                        //             console.log('\x1b[31m earliestSourceStatusTimestamp: \x1b[0m', earliestSourceStatusTimestamp);

                        //             // For the same activity, get the LATEST timestamp for the TARGET status
                        //             return activityCommonService.activityTimelineTxnSelectActivityStatus(request, rule.to_activity_status_id, 1)
                        //                 .then((data) => {
                        //                     // console.log('\x1b[31m Promise.resolve(data): \x1b[0m', data);
                        //                     return Promise.resolve(data);
                        //                 });
                        //         })
                        //         .then((data) => {

                        //             latestTargetStatusTimestamp = data[0].timeline_transaction_datetime;
                        //             console.log('\x1b[31m latestTargetStatusTimestamp: \x1b[0m', latestTargetStatusTimestamp);

                        //             // Determine the time duration for the transition from the earliest source 
                        //             // status to the latest target status
                        //             timeDuration = calculateDurationAsSeconds(earliestSourceStatusTimestamp, latestTargetStatusTimestamp);
                        //             console.log('\x1b[31m timeDuration: \x1b[0m', timeDuration);

                        //             return activityCommonService.activityStatusChangeTxnInsert(request, timeDuration, {
                        //                 from_status_id: Number(rule.from_activity_status_id),
                        //                 to_status_id: Number(rule.to_activity_status_id),
                        //                 from_status_datetime: earliestSourceStatusTimestamp,
                        //                 to_status_datetime: latestTargetStatusTimestamp
                        //             })
                        //         })

                        // } else {
                        //     // 
                        // }
                    }
                });
            });

        }).catch((err) => {
            console.log('\x1b[31m [Error] | Get previous immediate status: \x1b[0m', err);
        });

}

function calculateDurationAsSeconds(startDate, endDate) {
    var start_date = moment(startDate, 'YYYY-MM-DD HH:mm:ss');
    var end_date = moment(endDate, 'YYYY-MM-DD HH:mm:ss');
    var duration = moment.duration(end_date.diff(start_date));
    return duration.asSeconds();;
}

// Week
function getStartOfWeekForDate(dateTime) {
    return moment(dateTime).startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss');
}

function getEndOfWeekForDate(dateTime) {
    return moment(dateTime).endOf('isoWeek').format('YYYY-MM-DD HH:mm:ss');
}

// Month
function getStartOfMonthForDate(dateTime) {
    return moment(dateTime).startOf('month').format('YYYY-MM-DD HH:mm:ss');
}

function getEndOfMonthForDate(dateTime) {
    return moment(dateTime).endOf('month').format('YYYY-MM-DD HH:mm:ss');
}

module.exports = vodafoneStatusUpdate;
