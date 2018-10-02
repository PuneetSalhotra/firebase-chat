const StatsService = require("../services/statsService");

function statsController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var statsService = new StatsService(objCollection);

    app.post('/' + global.config.version + '/stats/signup/count', function statsSignUpCountReqHandler(req, res) {
        statsService.getSignUpCountStats(req.body, function statsSignUpCountCallback(err, data, statusCode) {
            if (!err) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log("err: ", err);
                global.logger.write('debug', 'err: ' + err, {}, req.body);
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        })
    });

    app.post('/' + global.config.version + '/stats/signup/list', function statsSignUpCountReqHandler(req, res) {
        statsService.getListOfSignUps(req.body, function statsListOfSignUpsCallback(err, data, statusCode) {
            if (!err) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log("err: ", err);
                global.logger.write('debug', 'err: ' + err, {}, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        })
    });

    app.post('/' + global.config.version + '/stats/timeline/list', function statsSignUpCountReqHandler(req, res) {
        statsService.getTimelineList(req.body, function statsTimelineListCallback(err, data, statusCode) {
            if (!err) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log("err: ", err);
                global.logger.write('debug', 'err: ' + err, {}, req.body);
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        })
    });

    // [VODAFONE] Get breakdown for count of orders on the basis of status of the order
    app.post('/' + global.config.version + '/stats/form/orders/count', function (req, res) {
        statsService.activityListSelectFormCountActivityStatus(req.body, function (err, data, statusCode) {
            if (!err) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                global.logger.write('debug', 'err: ' + err, {}, req.body);
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        })
    });

    // [VODAFONE] Get breakdown for sum of order value on the basis of status of the order
    app.post('/' + global.config.version + '/stats/form/orders/value', function (req, res) {
        statsService.activityFormTransactionSelectVodafoneFormValue(req.body, function (err, data, statusCode) {
            if (!err) {
                console.log(data);
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                global.logger.write('debug', 'err: ' + err, {}, req.body);
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        })
    });

    // [VODAFONE] Get breakdown for sum of order value on the basis of status of the order
    app.post('/' + global.config.version + '/stats/form/orders/value/daywise', function (req, res) {
        statsService.activityFormTransactionSelectVodafoneFormValueDay(req.body, function (err, data, statusCode) {
            if (!err) {
                var responseJSON = {
                    not_set: [],
                    cancelled: [],
                    resubmit: [],
                    reinitiate: [],
                    approved: [],
                    feasibility_check: [],
                    document_validation: []
                };
                // 
                data.forEach((row) => {
                    switch (Number(row.activity_status_id)) {
                        case 278421: // Document Validation
                            responseJSON.document_validation.push({
                                date: row.date,
                                value: row.value
                            });
                            break;

                        case 278417: // Resubmit
                            responseJSON.resubmit.push({
                                date: row.date,
                                value: row.value
                            });
                            break;

                        case 278416: // Feasibility Check
                            responseJSON.feasibility_check.push({
                                date: row.date,
                                value: row.value
                            });
                            break;

                        case 278419: // Approved
                            responseJSON.approved.push({
                                date: row.date,
                                value: row.value
                            });
                            break;

                        case 278418: // Reinitiate
                            responseJSON.reinitiate.push({
                                date: row.date,
                                value: row.value
                            });
                            break;

                        case 278420: // Cancelled
                            responseJSON.cancelled.push({
                                date: row.date,
                                count: row.value
                            });
                            break;

                        case 0: // Not Set
                            responseJSON.not_set.push({
                                date: row.date,
                                value: row.value
                            });
                            break;
                    }
                });
                res.send(responseWrapper.getResponse(err, responseJSON, statusCode, req.body));
            } else {
                global.logger.write('debug', 'err: ' + err, {}, req.body);
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        })
    });

    // [VODAFONE] Get breakdown for sum of order value on the basis of status of the order
    app.post('/' + global.config.version + '/stats/form/orders/count/daywise', function (req, res) {
        statsService.activityListSelectFormCountActivityStatusDay(req.body, function (err, data, statusCode) {
            if (!err) {
                var responseJSON = {
                    not_set: [],
                    cancelled: [],
                    resubmit: [],
                    reinitiate: [],
                    approved: [],
                    feasibility_check: [],
                    document_validation: []
                };
                // 
                data.forEach((row) => {
                    switch (Number(row.activity_status_id)) {
                        case 278421: // Document Validation
                            responseJSON.document_validation.push({
                                date: row.date,
                                count: row.count
                            });
                            break;

                        case 278417: // Resubmit
                            responseJSON.resubmit.push({
                                date: row.date,
                                count: row.count
                            });
                            break;

                        case 278416: // Feasibility Check
                            responseJSON.feasibility_check.push({
                                date: row.date,
                                count: row.count
                            });
                            break;

                        case 278419: // Approved
                            responseJSON.approved.push({
                                date: row.date,
                                count: row.count
                            });
                            break;

                        case 278418: // Reinitiate
                            responseJSON.reinitiate.push({
                                date: row.date,
                                count: row.count
                            });
                            break;

                        case 278420: // Cancelled
                            responseJSON.cancelled.push({
                                date: row.date,
                                count: row.count
                            });
                            break;

                        case 0: // Not Set
                            responseJSON.not_set.push({
                                date: row.date,
                                count: row.count
                            });
                            break;
                    }
                });

                res.send(responseWrapper.getResponse(err, responseJSON, statusCode, req.body));
            } else {
                global.logger.write('debug', 'err: ' + err, {}, req.body);
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        })
    });

    // [VODAFONE] Get breakdown for sum of order value on the basis of status of the order
    app.post('/' + global.config.version + '/stats/form/monthly/summary/params', function (req, res) {
        statsService.assetMonthlySummaryTransactionSelectFlag(req.body, 50, function (err, data, statusCode) {
            if (!err) {
                // 33	TAT - Document Validation to approved
                // 34	TAT - Document Validation to Feasibility Check
                // 35	Average time on Resubmit status
                // 36	Average time on Reinitiate status
                // 37	TAT - Feasibility Check to Approved
                var responseJSON = {
                    TAT_DV_TO_A: {
                        monthly_summary_id: 33,
                        monthly_summary_name: 'TAT - Document Validation to approved',
                        average: 0,
                        month: req.body.month_start_date
                    },
                    TAT_DV_TO_FC: {
                        monthly_summary_id: 34,
                        monthly_summary_name: 'TAT - Document Validation to Feasibility Check',
                        average: 0,
                        month: req.body.month_start_date
                    },
                    AVG_RESUBMIT: {
                        monthly_summary_id: 35,
                        monthly_summary_name: 'Average time on Resubmit status',
                        average: 0,
                        month: req.body.month_start_date
                    },
                    AVG_REINITIATE: {
                        monthly_summary_id: 36,
                        monthly_summary_name: 'Average time on Reinitiate status',
                        average: 0,
                        month: req.body.month_start_date
                    },
                    TAT_FC_TO_A: {
                        monthly_summary_id: 37,
                        monthly_summary_name: 'TAT - Feasibility Check to Approved',
                        average: 0,
                        month: req.body.month_start_date
                    },
                }
                // 
                data.forEach((summaryEntry) => {
                    switch (Number(summaryEntry.monthly_summary_id)) {
                        case 33:
                            responseJSON.TAT_DV_TO_A.average = summaryEntry.data_entity_double_1
                            break;
                        case 34:
                            responseJSON.TAT_DV_TO_FC.average = summaryEntry.data_entity_double_1
                            break;
                        case 35:
                            responseJSON.AVG_RESUBMIT.average = summaryEntry.data_entity_double_1
                            break;
                        case 36:
                            responseJSON.AVG_REINITIATE.average = summaryEntry.data_entity_double_1
                            break;
                        case 37:
                            responseJSON.TAT_FC_TO_A.average = summaryEntry.data_entity_double_1
                            break;
                    }
                });

                res.send(responseWrapper.getResponse(err, responseJSON, statusCode, req.body));
            } else {
                global.logger.write('debug', 'err: ' + err, {}, req.body);
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        })
    });
}

module.exports = statsController;
