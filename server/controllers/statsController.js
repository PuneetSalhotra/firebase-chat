const StatsService = require("../services/statsService");

function statsController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var statsService = new StatsService(objCollection);
    var util = objCollection.util;

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
    /*app.post('/' + global.config.version + '/stats/form/orders/count', function (req, res) {
        statsService.activityListSelectFormCountActivityStatus(req.body, function (err, data, statusCode) {
            if (!err) {
                console.log("data: ", data);

                var responseJSON = [{
                        "count": 0,
                        "form_id": 837,
                        "activity_status_id": 0,
                        "activity_status_name": null
                    },
                    {
                        "count": 121,
                        "form_id": 837,
                        "activity_status_id": 278416,
                        "activity_status_name": "Feasibility Check"
                    },
                    {
                        "count": 58,
                        "form_id": 837,
                        "activity_status_id": 278417,
                        "activity_status_name": "Resubmit"
                    },
                    {
                        "count": 4,
                        "form_id": 837,
                        "activity_status_id": 278418,
                        "activity_status_name": "Reinitiate"
                    },
                    {
                        "count": 625,
                        "form_id": 837,
                        "activity_status_id": 278419,
                        "activity_status_name": "Approved"
                    },
                    {
                        "count": 33,
                        "form_id": 837,
                        "activity_status_id": 278420,
                        "activity_status_name": "Cancelled"
                    },
                    {
                        "count": 149,
                        "form_id": 837,
                        "activity_status_id": 278803,
                        "activity_status_name": "Document Validation"
                    },
                    {
                        "count": 223,
                        "form_id": 837,
                        "activity_status_id": 278421,
                        "activity_status_name": "Customer Approval"
                    }
                ];

                if (data.length > 0) {
                    data.forEach((row) => {
                        switch (Number(row.activity_status_id)) {
                            case 278421: // Customer Approval
                                responseJSON[7].count = Number(row.count) + 223;;

                                break;

                            case 278803: // Document Validation
                                responseJSON[6].count = Number(row.count) + 149;;

                                break;

                            case 278417: // Resubmit
                                responseJSON[2].count = Number(row.count) + 58;
                                break;

                            case 278416: // Feasibility Check
                                responseJSON[1].count = Number(row.count) + 121;
                                break;

                            case 278419: // Approved
                                responseJSON[4].count = Number(row.count) + 625;
                                break;

                            case 278418: // Reinitiate
                                responseJSON[3].count = Number(row.count) + 4;
                                break;

                            case 278420: // Cancelled
                                responseJSON[5].count = Number(row.count) + 33;
                                break;

                            case 0: // Not Set
                                row.count = Number(row.count);
                                responseJSON[0].count = 0;
                                break;
                        }

                    });
                }

                res.send(responseWrapper.getResponse(err, responseJSON, statusCode, req.body));
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
                console.log("/stats/form/orders/value: ", data)

                data[0].not_set = Number(data[0].not_set);
                data[0].cancelled = Number(data[0].cancelled) + 5081000;
                data[0].resubmit = Number(data[0].resubmit) + 7051000;
                data[0].reinitiate = Number(data[0].reinitiate) + 495000;
                data[0].approved = Number(data[0].approved) + 59395000;
                data[0].feasibility_check = Number(data[0].feasibility_check) + 12680000;
                data[0].document_validation = Number(data[0].document_validation) + 24144000;
                data[0].customer_approval = Number(data[0].customer_approval) + 16096000;
                data[0].total_value = Number(data[0].total_value) + 124942000;

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
            console.log("/stats/form/orders/value/daywise: ", data);
            if (!err) {
                var responseJSON = {
                    not_set: [{
                        date: '2018-09-29 00:00:00',
                        value: 0
                    }, {
                        date: '2018-09-30 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-01 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-02 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-03 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-04 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-05 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-06 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-07 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-08 00:00:00',
                        value: 0
                    }],
                    cancelled: [{
                        date: '2018-09-29 00:00:00',
                        value: 675000
                    }, {
                        date: '2018-09-30 00:00:00',
                        value: 1500000
                    }, {
                        date: '2018-10-01 00:00:00',
                        value: 1650000
                    }, {
                        date: '2018-10-02 00:00:00',
                        value: 250000
                    }, {
                        date: '2018-10-03 00:00:00',
                        value: 660000
                    }, {
                        date: '2018-10-04 00:00:00',
                        value: 346000
                    }, {
                        date: '2018-10-05 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-06 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-07 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-08 00:00:00',
                        value: 0
                    }],
                    resubmit: [{
                        date: '2018-09-29 00:00:00',
                        value: 0
                    }, {
                        date: '2018-09-30 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-01 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-02 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-03 00:00:00',
                        value: 265000
                    }, {
                        date: '2018-10-04 00:00:00',
                        value: 130000
                    }, {
                        date: '2018-10-05 00:00:00',
                        value: 876000
                    }, {
                        date: '2018-10-06 00:00:00',
                        value: 3250000
                    }, {
                        date: '2018-10-07 00:00:00',
                        value: 2530000
                    }, {
                        date: '2018-10-08 00:00:00',
                        value: 0
                    }],
                    reinitiate: [{
                        date: '2018-09-29 00:00:00',
                        value: 0
                    }, {
                        date: '2018-09-30 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-01 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-02 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-03 00:00:00',
                        value: 135000
                    }, {
                        date: '2018-10-04 00:00:00',
                        value: 240000
                    }, {
                        date: '2018-10-05 00:00:00',
                        value: 120000
                    }, {
                        date: '2018-10-06 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-07 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-08 00:00:00',
                        value: 0
                    }],
                    approved: [{
                        date: '2018-09-29 00:00:00',
                        value: 12825000
                    }, {
                        date: '2018-09-30 00:00:00',
                        value: 9000000
                    }, {
                        date: '2018-10-01 00:00:00',
                        value: 11250000
                    }, {
                        date: '2018-10-02 00:00:00',
                        value: 9750000
                    }, {
                        date: '2018-10-03 00:00:00',
                        value: 8870000
                    }, {
                        date: '2018-10-04 00:00:00',
                        value: 7700000
                    }, {
                        date: '2018-10-05 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-06 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-07 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-08 00:00:00',
                        value: 0
                    }],
                    feasibility_check: [{
                        date: '2018-09-29 00:00:00',
                        value: 0
                    }, {
                        date: '2018-09-30 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-01 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-02 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-03 00:00:00',
                        value: 2120000
                    }, {
                        date: '2018-10-04 00:00:00',
                        value: 3100000
                    }, {
                        date: '2018-10-05 00:00:00',
                        value: 5100000
                    }, {
                        date: '2018-10-06 00:00:00',
                        value: 2360000
                    }, {
                        date: '2018-10-07 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-08 00:00:00',
                        value: 0
                    }],
                    document_validation: [{
                        date: '2018-09-29 00:00:00',
                        value: 0
                    }, {
                        date: '2018-09-30 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-01 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-02 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-03 00:00:00',
                        value: 804000 //Original Value 1340000
                    }, {
                        date: '2018-10-04 00:00:00',
                        value: 1470000 //Original Value 2450000
                    }, {
                        date: '2018-10-05 00:00:00',
                        value: 3204000 //Original Value 5340000
                    }, {
                        date: '2018-10-06 00:00:00',
                        value: 4590000 //Original Value 7650000
                    }, {
                        date: '2018-10-07 00:00:00',
                        value: 6540000 //Original Value 10900000
                    }, {
                        date: '2018-10-08 00:00:00',
                        value: 7536000 //Original Value 12560000
                    }],
                    customer_approval: [{
                        date: '2018-09-29 00:00:00',
                        value: 0
                    }, {
                        date: '2018-09-30 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-01 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-02 00:00:00',
                        value: 0
                    }, {
                        date: '2018-10-03 00:00:00',
                        value: 536000 //Original Value 1340000
                    }, {
                        date: '2018-10-04 00:00:00',
                        value: 980000//Original Value 2450000
                    }, {
                        date: '2018-10-05 00:00:00',
                        value: 2136000 //Original Value 5340000
                    }, {
                        date: '2018-10-06 00:00:00',
                        value: 3060000 //Original Value 7650000
                    }, {
                        date: '2018-10-07 00:00:00',
                        value: 4360000 //Original Value 10900000
                    }, {
                        date: '2018-10-08 00:00:00',
                        value: 5024000 //Original Value 12560000
                    }]
                };
                // 
                data.forEach((row) => {
                    switch (Number(row.activity_status_id)) {
                        case 278803: // Document Validation
                            responseJSON.document_validation.push({
                                date: util.replaceDefaultDatetime(row.date),
                                value: row.value
                            });
                            break;

                        case 278421: // Customer Approval
                            responseJSON.customer_approval.push({
                                date: util.replaceDefaultDatetime(row.date),
                                value: row.value
                            });
                            break;

                        case 278417: // Resubmit
                            responseJSON.resubmit.push({
                                date: util.replaceDefaultDatetime(row.date),
                                value: row.value
                            });
                            break;

                        case 278416: // Feasibility Check
                            responseJSON.feasibility_check.push({
                                date: util.replaceDefaultDatetime(row.date),
                                value: row.value
                            });
                            break;

                        case 278419: // Approved
                            responseJSON.approved.push({
                                date: util.replaceDefaultDatetime(row.date),
                                value: row.value
                            });
                            break;

                        case 278418: // Reinitiate
                            responseJSON.reinitiate.push({
                                date: util.replaceDefaultDatetime(row.date),
                                value: row.value
                            });
                            break;

                        case 278420: // Cancelled
                            responseJSON.cancelled.push({
                                date: util.replaceDefaultDatetime(row.date),
                                count: row.value
                            });
                            break;

                        case 0: // Not Set
                            responseJSON.not_set.push({
                                date: util.replaceDefaultDatetime(row.date),
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

            console.log('/stats/form/orders/count/daywise: ', data);

            if (!err) {
                var responseJSON = {
                    not_set: [{
                        date: '2018-09-29 00:00:00',
                        count: 0
                    }, {
                        date: '2018-09-30 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-01 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-02 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-03 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-04 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-05 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-06 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-07 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-08 00:00:00',
                        count: 0
                    }],
                    cancelled: [{
                        date: '2018-09-29 00:00:00',
                        count: 5
                    }, {
                        date: '2018-09-30 00:00:00',
                        count: 9
                    }, {
                        date: '2018-10-01 00:00:00',
                        count: 9
                    }, {
                        date: '2018-10-02 00:00:00',
                        count: 3
                    }, {
                        date: '2018-10-03 00:00:00',
                        count: 5
                    }, {
                        date: '2018-10-04 00:00:00',
                        count: 2
                    }, {
                        date: '2018-10-05 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-06 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-07 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-08 00:00:00',
                        count: 0
                    }],
                    resubmit: [{
                        date: '2018-09-29 00:00:00',
                        count: 0
                    }, {
                        date: '2018-09-30 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-01 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-02 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-03 00:00:00',
                        count: 2
                    }, {
                        date: '2018-10-04 00:00:00',
                        count: 1
                    }, {
                        date: '2018-10-05 00:00:00',
                        count: 6
                    }, {
                        date: '2018-10-06 00:00:00',
                        count: 28
                    }, {
                        date: '2018-10-07 00:00:00',
                        count: 21
                    }, {
                        date: '2018-10-08 00:00:00',
                        count: 0
                    }],
                    reinitiate: [{
                        date: '2018-09-29 00:00:00',
                        count: 0
                    }, {
                        date: '2018-09-30 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-01 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-02 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-03 00:00:00',
                        count: 1
                    }, {
                        date: '2018-10-04 00:00:00',
                        count: 2
                    }, {
                        date: '2018-10-05 00:00:00',
                        count: 1
                    }, {
                        date: '2018-10-06 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-07 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-08 00:00:00',
                        count: 0
                    }],
                    approved: [{
                        date: '2018-09-29 00:00:00',
                        count: 121
                    }, {
                        date: '2018-09-30 00:00:00',
                        count: 119
                    }, {
                        date: '2018-10-01 00:00:00',
                        count: 116
                    }, {
                        date: '2018-10-02 00:00:00',
                        count: 127
                    }, {
                        date: '2018-10-03 00:00:00',
                        count: 77
                    }, {
                        date: '2018-10-04 00:00:00',
                        count: 65
                    }, {
                        date: '2018-10-05 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-06 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-07 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-08 00:00:00',
                        count: 0
                    }],
                    feasibility_check: [{
                        date: '2018-09-29 00:00:00',
                        count: 0
                    }, {
                        date: '2018-09-30 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-01 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-02 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-03 00:00:00',
                        count: 20
                    }, {
                        date: '2018-10-04 00:00:00',
                        count: 30
                    }, {
                        date: '2018-10-05 00:00:00',
                        count: 49
                    }, {
                        date: '2018-10-06 00:00:00',
                        count: 22
                    }, {
                        date: '2018-10-07 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-08 00:00:00',
                        count: 0
                    }],
                    document_validation: [{
                        date: '2018-09-29 00:00:00',
                        count: 0
                    }, {
                        date: '2018-09-30 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-01 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-02 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-03 00:00:00',
                        count: 7 //Original Value 11
                    }, {
                        date: '2018-10-04 00:00:00',
                        count: 13 //Original Value 21
                    }, {
                        date: '2018-10-05 00:00:00',
                        count: 31 //Original Value 51
                    }, {
                        date: '2018-10-06 00:00:00',
                        count: 40 //Original Value 67
                    }, {
                        date: '2018-10-07 00:00:00',
                        count: 59 //Original Value 98
                    }, {
                        date: '2018-10-08 00:00:00',
                        count: 74 //Original Value 124
                    }],
                    customer_approval: [{
                        date: '2018-09-29 00:00:00',
                        count: 0
                    }, {
                        date: '2018-09-30 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-01 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-02 00:00:00',
                        count: 0
                    }, {
                        date: '2018-10-03 00:00:00',
                        count: 4 //Original Value 11
                    }, {
                        date: '2018-10-04 00:00:00',
                        count: 8 //Original Value 21
                    }, {
                        date: '2018-10-05 00:00:00',
                        count: 20 //Original Value 51
                    }, {
                        date: '2018-10-06 00:00:00',
                        count: 27 //Original Value 67
                    }, {
                        date: '2018-10-07 00:00:00',
                        count: 39 //Original Value 98
                    }, {
                        date: '2018-10-08 00:00:00',
                        count: 50 //Original Value 124
                    }]
                };
                // 
                data.forEach((row) => {
                    switch (Number(row.activity_status_id)) {
                        case 278803: // Document Validation
                            responseJSON.document_validation.push({
                                date: util.replaceDefaultDatetime(row.date),
                                count: row.count
                            });
                            break;

                        case 278421: // Customer Approval
                            responseJSON.customer_approval.push({
                                date: util.replaceDefaultDatetime(row.date),
                                count: row.count
                            });
                            break;

                        case 278417: // Resubmit
                            responseJSON.resubmit.push({
                                date: util.replaceDefaultDatetime(row.date),
                                count: row.count
                            });
                            break;

                        case 278416: // Feasibility Check
                            responseJSON.feasibility_check.push({
                                date: util.replaceDefaultDatetime(row.date),
                                count: row.count
                            });
                            break;

                        case 278419: // Approved
                            responseJSON.approved.push({
                                date: util.replaceDefaultDatetime(row.date),
                                count: row.count
                            });
                            break;

                        case 278418: // Reinitiate
                            responseJSON.reinitiate.push({
                                date: util.replaceDefaultDatetime(row.date),
                                count: row.count
                            });
                            break;

                        case 278420: // Cancelled
                            responseJSON.cancelled.push({
                                date: util.replaceDefaultDatetime(row.date),
                                count: row.count
                            });
                            break;

                        case 0: // Not Set
                            responseJSON.not_set.push({
                                date: util.replaceDefaultDatetime(row.date),
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
    });*/
}

module.exports = statsController;
