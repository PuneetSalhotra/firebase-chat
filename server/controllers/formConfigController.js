/*
 *author: Sri Sai Venkatesh 
 * 
 */

var FormConfigService = require("../services/formConfigService");
const moment = require('moment');

function FormConfigController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var util = objCollection.util;
    var queueWrapper = objCollection.queueWrapper;
    const cacheWrapper = objCollection.cacheWrapper;

    var formConfigService = new FormConfigService(objCollection);

    app.post('/' + global.config.version + '/form/access/organisation/list', function (req, res) {

        formConfigService.getOrganizationalLevelForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('debug', 'did not get proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/form/access/account/list', function (req, res) {

        formConfigService.getAccountLevelForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('debug', 'did not get proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/form/access/workforce/list', function (req, res) {

        formConfigService.getWorkforceLevelForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('debug', 'did not get proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/form/access/activity/list', function (req, res) {

        formConfigService.getActivityLevelForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('debug', 'did not get proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/form/access/global/entry/collection', function (req, res) {

        formConfigService.getSpecifiedForm(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                //console.log('did not get proper rseponse');
                global.logger.write('debug', 'did not get proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Added By Nani Kalyan for BETA
    app.post('/' + global.config.version + '/form/register/access/workforce/list', function (req, res) {
        formConfigService.getRegisterForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/form/access/workforce/timeline/list', function (req, res) {
        formConfigService.getAllFormSubmissions(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });


    //Added By Nani Kalyan for BETA
    /*app.post('/' + global.config.version + '/form/register/access/workforce/list', function (req, res) {
        formConfigService.getRegisterForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });*/

    // Endpoint to fetch specific Timecard Forms (all, 325, 800 or 801)
    app.post('/' + global.config.version + '/form/access/asset/timecard/list', function (req, res) {
        // Sanity check
        if (req.body.datetime_start === undefined || req.body.datetime_end === undefined || req.body.flag === undefined) {
            let data = 'One or more of the request parameters is missing.';
            res.send(responseWrapper.getResponse(true, data, -3308, req.body));
            return;
        } else if (!moment(req.body.datetime_start, 'YYYY-MM-DD HH:mm:ss').isValid() || !moment(req.body.datetime_end, 'YYYY-MM-DD HH:mm:ss').isValid()) {
            let data = 'Invalid datetime format.';
            res.send(responseWrapper.getResponse(true, data, -3308, req.body));
            return;
        }

        // Fetch the Timecard Forms
        formConfigService.getManualMobileAndWebTimecardForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });


    //Get the list of forms submitted by the user
    //Search the list of forms submitted by the user
    app.post('/' + global.config.version + '/form/access/user/list', function (req, res) {
        formConfigService.getSearchUserForms(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });


    app.post('/' + global.config.version + '/form/activity/alter', function (req, res) {
        var deviceOsId = 0;
        if (req.body.hasOwnProperty('device_os_id'))
            deviceOsId = Number(req.body.device_os_id);

        var proceedInlineUpdate = function () {
            var event = {
                name: "alterFormActivity",
                service: "formConfigService",
                method: "alterFormActivity",
                payload: req.body
            };

            queueWrapper.raiseActivityEvent(event, req.body.activity_id, (err, resp) => {
                if (err) {
                    //console.log('Error in queueWrapper raiseActivityEvent : ' + resp)
                    //global.logger.write('serverError',"Error in queueWrapper raiseActivityEvent",err,req);
                    res.send(responseWrapper.getResponse(false, {}, -5999, req.body));
                    throw new Error('Crashing the Server to get notified from the kafka broker cluster about the new Leader');
                } else {
                    if (req.hasOwnProperty('device_os_id')) {
                        if (Number(req.device_os_id) !== 5) {
                            //incr the asset_message_counter                        
                            cacheWrapper.setAssetParity(req.asset_id, req.asset_message_counter, function (err, status) {
                                if (err) {
                                    //console.log("error in setting in asset parity");
                                    global.logger.write('serverError', "error in setting in asset parity", err, req.body);
                                } else
                                    //console.log("asset parity is set successfully")
                                    global.logger.write('conLog', "asset parity is set successfully", {}, req.body);

                            });
                        }
                    }
                    res.send(responseWrapper.getResponse(false, {}, 200, req.body));
                }
            });
            //res.send(responseWrapper.getResponse(false, {}, 200,req.body));
            //return;
        };
        try {
            JSON.parse(req.body.activity_inline_data);
            // console.log('json is fine');
            global.logger.write('conLog', "json is fine", {}, req.body);

        } catch (exeption) {
            res.send(responseWrapper.getResponse(false, {}, -3308, req.body));
            return;
        }
        if (util.hasValidActivityId(req.body)) {
            if ((util.isValidAssetMessageCounter(req.body)) && deviceOsId !== 5) {
                cacheWrapper.checkAssetParity(req.body.asset_id, Number(req.body.asset_message_counter), function (err, status) {
                    if (err) {
                        res.send(responseWrapper.getResponse(false, {}, -7998, req.body));
                    } else {
                        if (status) { // proceed
                            proceedInlineUpdate();
                        } else { // this is a duplicate hit,
                            res.send(responseWrapper.getResponse(false, {}, 200, req.body));
                        }
                    }
                });

            } else if (deviceOsId === 5) {
                proceedInlineUpdate();

            } else {
                res.send(responseWrapper.getResponse(false, {}, -3304, req.body));
            }
        } else {
            res.send(responseWrapper.getResponse(false, {}, -3301, req.body));
        }

    });

    app.post('/' + global.config.version + '/form/field/combo/list', function (req, res) {
        formConfigService.getFormFieldComboValues(req.body).then((data) => {
            //console.log(data);
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            let data = {};
            res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });
    });

    // "Service for creating form definition
    // This should also have provision to map the form at the specified access level
    // There should be an optional provision to map the form definition to an activity_type"
    app.post('/' + global.config.version + '/form/add', async function (req, res) {

        const [err, formData] = await formConfigService.formAdd(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
        }

    });

    app.post('/' + global.config.version + '/form/field/list', async function (req, res) {

        const [err, formFieldList] = await formConfigService.fetchFormFieldList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formFieldList, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formFieldList, -9999, req.body));
        }

    });

    // Service for getting the list of forms at the specified access level and optionally 
    // mapped to an activity type. If mapped to activity type also return the sequnece id, 
    // origin flag and percentage contribution to the workflow
    app.post('/' + global.config.version + '/form/access/list', async function (req, res) {

        const [err, formAccessList] = await formConfigService.fetchFormAccessList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formAccessList, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formAccessList, -9999, req.body));
        }

    });

    // Service for getting the submitted flag status of all the forms mapped to an activity of category workflow
    app.post('/' + global.config.version + '/workflow/form/status/submitted/list', async function (req, res) {

        const [err, workflowFormSubmittedStatusList] = await formConfigService.fetchWorkflowFormSubmittedStatusList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, workflowFormSubmittedStatusList, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, workflowFormSubmittedStatusList, -9999, req.body));
        }

    });

    // Service for mapping form definitions to activity type. Forms are mapped mutually exclusively to activity types.
    // This service should have provision for setting or resetting the origin flag, altering the sequnce id and 
    // percentage contribution to the workflow. Only one out of all the forms mapped to an activity type can have 
    // the origin flag enabled
    app.post('/' + global.config.version + '/form/mapping/activity_type/set', async function (req, res) {

        // flag: 1 => Udpdate both activity_type mapping and config values
        // flag: 2 => Udpdate activity_type mapping only
        // flag: 3 => Udpdate config values only

        const [err, updateStatus] = await formConfigService.setActivityTypeAndConfig(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, updateStatus, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, updateStatus, -9999, req.body));
        }

    });

    // Services for unmapping form definitions to activity type
    app.post('/' + global.config.version + '/form/mapping/activity_type/reset', async function (req, res) {

        // flag: 1 => Udpdate both activity_type mapping and config values
        // flag: 2 => Udpdate activity_type mapping only
        // flag: 3 => Udpdate config values only

        const [err, updateStatus] = await formConfigService.resetActivityTypeAndConfig(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, updateStatus, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, updateStatus, -9999, req.body));
        }

    });

    // THIS IS A DUMMY/TEST ENDPOINT
    // app.post('/' + global.config.version + '/workflow/test/1', async function (req, res) {

    //     // flag: 1 => Udpdate both activity_type mapping and config values
    //     // flag: 2 => Udpdate activity_type mapping only
    //     // flag: 3 => Udpdate config values only

    //     const [err, workflowStatus] = await formConfigService.alterFormActivityFieldValues(req.body);
    //     if (!err) {
    //         res.send(responseWrapper.getResponse({}, workflowStatus, 200, req.body));
    //     } else {
    //         console.log("Error: ", err)
    //         res.send(responseWrapper.getResponse(err, workflowStatus, -9999, req.body));
    //     }
    // });

    // // THIS IS A DUMMY/TEST ENDPOINT
    // app.post(['/' + global.config.version + '/workflow/test/2', '/' + global.config.version + '/workflow/test/3'], async function (req, res) {

    //     // flag: 1 => Udpdate both activity_type mapping and config values
    //     // flag: 2 => Udpdate activity_type mapping only
    //     // flag: 3 => Udpdate config values only

    //     const [err, workflowStatus] = await formConfigService.workflowOnFormEdit(req.body);
    //     if (!err) {
    //         res.send(responseWrapper.getResponse({}, workflowStatus, 200, req.body));
    //     } else {
    //         console.log("Error: ", err)
    //         res.send(responseWrapper.getResponse(err, workflowStatus, -9999, req.body));
    //     }

    // });


    app.post('/' + global.config.version + '/form/transaction/data', function (req, res) {

        formConfigService.getFormTransactionData(req.body).then((data) => {
            //console.log(data);
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });
    });

    // Service for modifying form definition
    app.post('/' + global.config.version + '/form/field/definition/update', async function (req, res) {

        const [err, updateStatus] = await formConfigService.formFieldDefinitionUpdate(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, updateStatus, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, updateStatus, -9999, req.body));
        }

    });

    // Service for form feilds validation bot
    app.post('/' + global.config.version + '/form/field/bot/validation', async function (req, res) {

        const [err, response] = await formConfigService.formFieldbotValidation(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, response, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, response, -9999, req.body));
        }

    });

    // Service for updating the form name
    app.post('/' + global.config.version + '/form/field/form_name/update', async function (req, res) {

        const [err, updateStatus] = await formConfigService.formFieldNameUpdate(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, updateStatus, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, updateStatus, -9999, req.body));
        }
    });

    // Service for deleting form field definitions
    app.post('/' + global.config.version + '/form/field/definition/delete', async function (req, res) {

        const [err, updateStatus] = await formConfigService.formFieldDefinitionDelete(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, updateStatus, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, updateStatus, -9999, req.body));
        }
    });

    // Service for inserting form field definitions
    app.post('/' + global.config.version + '/form/field/definition/insert', async function (req, res) {

        const [err, updateStatus] = await formConfigService.formFieldDefinitionInsert(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, updateStatus, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, updateStatus, -9999, req.body));
        }
    });

    // Service for lists bots dependant on a form field
    app.post('/' + global.config.version + '/form/field/bot/list', async function (req, res) {

        const [err, botsListData] = await formConfigService.formFieldBotList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, botsListData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, botsListData, -9999, req.body));
        }
    });

    // Service for inserting form field definitions
    app.post('/' + global.config.version + '/form/field/widget/list', async function (req, res) {

        const [err, widgetListData] = await formConfigService.formFieldWidgetList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, widgetListData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, widgetListData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/data_type/list', function (req, res) {

        formConfigService.getDataTypeList(req.body).then((data) => {
            //console.log(data);
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });
    });

    app.post('/' + global.config.version + '/form/field/numeric', function (req, res) {

        formConfigService.workforceFormFieldMappingSelectNumericFields(req.body).then((data) => {
            //console.log(data);
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });
    });

    // Service for lists bots dependant on a form field
    app.post('/' + global.config.version + '/form/field/bot_widget/list', async function (req, res) {

        const [err, botsWidgetsListData] = await formConfigService.formFieldBotWidgetList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, botsWidgetsListData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, botsWidgetsListData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/form/entity/list', async function (req, res) {
        // 0 => Both the origin and non-origin forms
        // 1 => Only origin forms

        const [err, formEntityData] = await formConfigService.formEntityMappingSelect(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formEntityData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formEntityData, -9999, req.body));
        }
    });

    //Returning the global forms in v1
    app.post('/' + global.config.version + '/form/entity/list/v1', async function (req, res) {
        // 0 => Both the origin and non-origin forms
        // 1 => Only origin forms

        const [err, formEntityData] = await formConfigService.formEntityMappingSelectV1(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formEntityData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formEntityData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/form/definition/list', async function (req, res) {

        const [err, formFieldData] = await formConfigService.workforceFormFieldMappingSelectForm(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formFieldData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formFieldData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/form/entity/access/check', async function (req, res) {

        const [err, formFieldData] = await formConfigService.formEntityAccessCheck(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formFieldData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formFieldData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/form/entity/access/asset/check', async function (req, res) {

        const [err, formFieldData] = await formConfigService.formEntityAccessAssetCheck(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formFieldData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formFieldData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/form/workforce/list', async function (req, res) {

        const [err, formWorkforceData] = await formConfigService.formEntityMappingSelectForm(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formWorkforceData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formWorkforceData, -9999, req.body));
        }
    }); 

    app.post(
        '/' + global.config.version + '/form/workforce/access/set',
        async (req, res) => {
            try {
                let result = await formConfigService.setMultipleWorkforceAccess(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } catch (err) {
                console.log("error ",err);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            }
        }
    );   
    
    app.post(
        '/' + global.config.version + '/form/workforce/access/remove',
        async (req, res) => {
            
                let [err,result] = await formConfigService.removeWorkforceAccess(req.body);
                if(!err){

                res.send(responseWrapper.getResponse(false, result, 200, req.body));
                }
                else{
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
                }
            
        }
    ); 

    app.post('/' + global.config.version + '/get/form/workflow/origin', async function (req, res) {

        const [err, formEntityData] = await formConfigService.formEntityMappingSelectProcessOrigin(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formEntityData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formEntityData, -9999, req.body));
        }

    }); 

    app.post('/' + global.config.version + '/form/global_forms/access/list', async function (req, res) {

        const [err, formData] = await formConfigService.getGlobalForms(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
        }

    });

    // Get the count of fields in a form
    app.post('/' + global.config.version + '/form/fields/count', async function (req, res) {
        const [err, formFieldCount] = await formConfigService.getFormFieldsCount(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formFieldCount, 200, req.body));
        } else {
            console.log("/form/fields/count | Error: ", err);
            res.send(responseWrapper.getResponse(err, formFieldCount, -9999, req.body));
        }
    });

    // Insert the form field history
    app.post('/' + global.config.version + '/form/fields/history', async function (req, res) {
        const [err, formFieldHistory] = await formConfigService.insertFormFieldsHistory(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formFieldHistory, 200, req.body));
        } else {
            console.log("/form/fields/history | Error: ", err);
            res.send(responseWrapper.getResponse(err, formFieldHistory, -9999, req.body));
        }
    });

    // Get the status based forms in a workflow
    app.post('/' + global.config.version + '/workflow/status_based/form/list', async (req, res) => {
        const [err, formData] = await formConfigService.getStatusBasedForms(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formData, 200, req.body));
        } else {
            console.log("/workflow/status_based/form/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
        }
    });

    // Delete the form field mapping - single selection and multi selection
    app.post('/' + global.config.version + '/workflow/form/field/alter', async (req, res) => {
        const [err, formData] = await formConfigService.workforceFormFieldMappingDeleteFunc(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formData, 200, req.body));
        } else {
            console.log("/workflow/form/field/alter | Error: ", err);
            res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
        }
    });

    // Insert the status based forms in a workflow
    app.post('/' + global.config.version + '/workflow/status_based/form/add', async (req, res) => {
        try{            
            console.log("req.body.form_ids : ", req.body.form_ids);
            console.log("typeof req.body.form_ids : ", typeof req.body.form_ids);
                        
            JSON.parse(req.body.form_ids);
            const [err, formData] = await formConfigService.insertStatusBasedForms(req.body);
            if (!err) {
                res.send(responseWrapper.getResponse({}, formData, 200, req.body));
            } else {
                console.log("/workflow/status_based/form/add | Error: ", err);
                res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
            }
        } catch(err) {
            console.log("/workflow/status_based/form/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, "form id paramter is not a valid array", -3308, req.body));
        }
        
    });


    // Delete the status based forms in a workflow
    app.post('/' + global.config.version + '/workflow/status_based/form/alter', async (req, res) => {
        const [err, formData] = await formConfigService.deleteStatusBasedForms(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formData, 200, req.body));
        } else {
            console.log("/workflow/status_based/form/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
        }
    });


    //Save the draft form
    app.post('/' + global.config.version + '/draft/form/add', async (req, res) => {
        const [err, formData] = await formConfigService.draftFormAdd(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formData, 200, req.body));
        } else {
            console.log("/draft/form/add | Error: ", err);
            res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
        }
    });

    //List draft forms of as asset
    app.post('/' + global.config.version + '/draft/form/list', async (req, res) => {
        const [err, formData] = await formConfigService.draftFormList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formData, 200, req.body));
        } else {
            console.log("/draft/form/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/draft/form/alter', async (req, res) => {
        const [err, formData] = await formConfigService.draftFormAlter(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formData, 200, req.body));
        } else {
            console.log("/draft/form/alter | Error: ", err);
            res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/draft/form/archive', async (req, res) => {
        const [err, formData] = await formConfigService.draftFormDelete(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formData, 200, req.body));
        } else {
            console.log("/draft/form/archive | Error: ", err);
            res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
        }
    });

    
    app.post('/' + global.config.version + '/workflow/form/submissions/list', async (req, res) => {
        const [err, formData] = await formConfigService.getMultipleSubmissionsData(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formData, 200, req.body));
        } else {
            console.log("/workflow/form/submissions/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/workflow/asset_level/forms/list', async (req, res) => {
        const [err, formData] = await formConfigService.assetLevelForms(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formData, 200, req.body));
        } else {
            console.log("/workflow/asset_level/forms/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/form/alter/status-rollback/check', async (req, res) => {
        const [err, formData] = await formConfigService.fieldAlterCheck(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formData, 200, req.body));
        } else {
            console.log("/workflow/asset_level/forms/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, formData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/form/access/status/list', async function (req, res) {

        const [err, formAccessList] = await formConfigService.formEntityAccessWithStatus(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formAccessList, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formAccessList, -9999, req.body));
        }

    });  

    app.post('/' + global.config.version + '/form/entity/access/list', async function (req, res) {

        const [err, formFieldData] = await formConfigService.formEntityAccessList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formFieldData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formFieldData, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/form/entity-mapping/access/list', async (req, res) => {
        const [err, formFieldData] = await formConfigService.formEntityWorkflowFormsAccessList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formFieldData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formFieldData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/form/participant/set', async (req, res) => {
        const [err, formFieldData] = await formConfigService.formParticipantSet(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formFieldData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formFieldData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/form/participant/reset', async (req, res) => {
        const [err, formFieldData] = await formConfigService.formParticipantReset(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, formFieldData, 200, req.body));
        } else {
            console.log("Error: ", err);
            res.send(responseWrapper.getResponse(err, formFieldData, -9999, req.body));
        }
    });

    //To know whether a form is smart or not
    app.post('/' + global.config.version + '/form/type/list', async (req, res) => {
        const [err, responseData] = await formConfigService.getSmartNonSmartForm(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/form/type/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/form/auto-populate/list', async (req, res) => {
        const [err, responseData] = await formConfigService.autoPopulateForm(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/form/type/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/form/access/search/list', async (req, res) => {
        const [err, responseData] = await formConfigService.formAccessSearchList(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/form/access/search/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/retrieve/edc/transaction', async (req, res) => {
        const [err, responseData] = await formConfigService.retrieveEdcTransaction(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/retrieve/edc/transaction | Error: ", err);
            res.send(responseWrapper.getResponse(err, responseData, -9999, req.body));
        }
    });
}

module.exports = FormConfigController;
