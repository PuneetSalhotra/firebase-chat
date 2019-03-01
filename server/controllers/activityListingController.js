/*
 *author: Sri Sai Venkatesh 
 * 
 */

var ActivityListingService = require("../services/activityListingService");
const moment = require('moment');

function ActivityListingController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    const activityCommonService = objCollection.activityCommonService;
    var app = objCollection.app;

    var activityListingService = new ActivityListingService(objCollection);

    app.post('/' + global.config.version + '/activity/access/asset/list', function (req, res) {
        activityListingService.getActivityListDifferential(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //PAM
    app.post('/' + global.config.version + '/activity/access/account/list', function (req, res) {
        activityListingService.getActivityAssetAccountLevelDifferential(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/inline/collection', function (req, res) {
        activityListingService.getActivityInlineCollection(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });   
    
    app.post('/' + global.config.version + '/activity/cover/collection', function (req, res) {
        activityListingService.getActivityCoverCollection(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/activity/cover/collection/v1', function (req, res) {
        activityListingService.getActivityCoverCollectionV1(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    
    app.post('/' + global.config.version + '/activity/coworker/access/organization/list', function (req, res) {
        activityListingService.getCoworkers(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    /*
    app.post('/' + global.config.version + '/activity/contact/access/asset/list', function (req, res) {
        activityListingService.getSharedContacts(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper response');
                global.logger.write('response','did not get proper response',err,req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    */

    app.post('/' + global.config.version + '/activity/access/asset/search', function (req, res) {
        activityListingService.searchActivityByType(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });


    app.post('/' + global.config.version + '/activity/contact/access/asset/search', function (req, res) {
        activityListingService.searchSharedContacts(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/activity/contact/access/asset/list', function (req, res) {
        activityListingService.listContacts(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/activity/mail/access/asset/search', function (req, res) {
        activityListingService.searchMail(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/activity/stats/duevstotal/collection', function (req, res) {
        activityListingService.getDuevsTotal(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response  
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/activity/access/asset/filter/daterange', function (req, res) {
        activityListingService.getActivityListDateRange(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response  
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
   app.post('/' + global.config.version + '/activity/all-contact/access/asset/list', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.getAllContactTypes(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper rseponse');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/activity/all-contact/access/asset/search', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.searchAllContactTypes(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper rseponse');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    }); 
    
    //BETA
    app.post('/' + global.config.version + '/activity/video_conference/access/asset/list', function (req, res) {
        activityListingService.getVideoConfSchedule(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper rseponse');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //BETA
    app.post('/' + global.config.version + '/activity/meeting_room/access/search', function (req, res) {
        activityListingService.getOptimumMeetingRoom(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper rseponse');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //BETA
    app.post('/' + global.config.version + '/activity/access/folder/list', function (req, res) {
        activityListingService.getAllFolders(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper rseponse');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //BETA
    app.post('/' + global.config.version + '/activity/access/project/list', function (req, res) {
        activityListingService.getAllProjects(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper rseponse');
                global.logger.write('response', 'Did not get a proper response', err, req.body);
                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Get the count of all Folders, mail, video calls etc
    app.post('/' + global.config.version + '/asset/access/counts/list', function (req, res) {
        activityListingService.getAllPendingCounts(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    //badge count service
    app.post('/' + global.config.version + '/asset/access/counts/list/V1', function (req, res) {
        activityListingService.getAllPendingCountsV1(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    
    //Get the counts on task lists (explicitly for task list)
    app.post('/' + global.config.version + '/asset/access/tasklist/counts/list', function (req, res) {
        activityListingService.getTaskListCounts(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    //Get the count of tasks     
    app.post('/' + global.config.version + '/asset/access/pending_task/count', function (req, res) {
        activityListingService.pendingInmailCount(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
	});
    });

    //Get the overall ToDo tasks where I am not collaborator (BAck ward compatability)
    app.post('/' + global.config.version + '/asset/access/task/list', function (req, res) {
        activityListingService.getTasks(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
	});
    });   
    
    app.post('/' + global.config.version + '/asset/access/task/list/v1', function (req, res) {
        activityListingService.getTasksV1(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
	});
    });    
    
    
    //Get the count of tasks 
    app.post('/' + global.config.version + '/asset/access/pending_task/count', function (req, res) {
        activityListingService.pendingInmailCount(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Get the overall ToDo tasks where I am not collaborator (BAck ward compatability)
    app.post('/' + global.config.version + '/asset/access/task/list', function (req, res) {
        activityListingService.getTasks(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Get the count of all Folders, mail, video calls etc
    app.post('/' + global.config.version + '/activity/access/asset/payroll/list', function (req, res) {
        activityListingService.getLatestPayrollActivity(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //
    app.post('/' + global.config.version + '/activity/access/asset/category/search', function (req, res) {
        activityListingService.searchActivityByCategory(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //Get the count of all tasks of an asset in a project
        app.post('/' + global.config.version + '/asset/tasks_project/access/counts/list', function (req, res) {
        activityListingService.getAssetTasksInProjCount(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/asset/phonenumber/access/organization/list', function (req, res) {
        activityListingService.getOrganizationsOfANumber(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    // List meetings for a given date range
    app.post('/' + global.config.version + '/asset/access/meetings/list', function (req, res) {
        // Sanity check
        // 1. A valid date range is mandatory
        // The date range must be present
        if (!moment(req.body.datetime_start).isValid() || !moment(req.body.datetime_start).isValid()) {
            let data = 'Invalid start/end date.';
            res.send(responseWrapper.getResponse(true, data, -3308, req.body));
            return;
        }
        // 2. If the search-with-string flag is set, there must be a valid search string
        if (Number(req.body.flter_flag) === 11) {
            if (typeof req.body.search_string === 'undefined' || req.body.search_string === '') {
                let data = 'Search flag set, but invalid/empty search string found.';
                res.send(responseWrapper.getResponse(true, data, -3309, req.body));
                return;
            }
        }
        // 
        // Fetch list of meetings
        activityListingService.listMeetingsByDateRangeOrSearchString(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Count of meetings for a given date range
    app.post('/' + global.config.version + '/asset/access/meetings/count', function (req, res) {
        // Sanity check
        // 1. A valid date range is mandatory
        // The date range must be present
        if (!moment(req.body.datetime_start).isValid() || !moment(req.body.datetime_start).isValid()) {
            let data = 'Invalid start/end date.';
            res.send(responseWrapper.getResponse(true, data, -3308, req.body));
            return;
        }
        // 2. If the search-with-string flag is set, there must be a valid search string
        if (Number(req.body.flter_flag) === 11) {
            if (typeof req.body.search_string === 'undefined' || req.body.search_string === '') {
                let data = 'Search flag set, but invalid/empty search string found.';
                res.send(responseWrapper.getResponse(true, data, -3309, req.body));
                return;
            }
        }
        // 
        // Fetch count of meetings
        activityListingService.countOfMeetingsByDateRangeOrSearchString(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Check whether a chat exists between two assets 
    app.post('/' + global.config.version + '/asset/access/chat/is_exist', function (req, res) {
        // Sanity check
        // 1. Check if creator asset_id < owner asset_id
        // 
        if (Number(req.body.creator_asset_id) > Number(req.body.owner_asset_id)) {
            let data = 'The creator asset_id must be less than the owner asset_id.';
            res.send(responseWrapper.getResponse(true, data, -3206, req.body));
            return;
        }
        // 
        // Verify if chat exists
        activityListingService.checkIfChatExists(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Fetch list of recent chats for the asset
    app.post('/' + global.config.version + '/asset/access/chat/list', function (req, res) {
        // 
        // Fetch list of recent chats for the asset
        activityListingService.fetchRecentChatList(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Check if a form transaction with a specific form_id has already been 
    // submitted on a form file
    app.post('/' + global.config.version + '/activity/form_transaction/check', function (req, res) {
        // 
        // Check if a form transaction with a specific form_id has already 
        // been submitted on a form file
        activityCommonService
            .getActivityTimelineTransactionByFormId(req.body, req.body.activity_id, req.body.form_id)
            .then((data) => {
                res.send(responseWrapper.getResponse(false, data, 200, req.body));
            })
            .catch((err) => {
                let data = {};
                res.send(responseWrapper.getResponse(err, data, -9998, req.body));
            });
    });

    // Check if a form transaction with a specific form_id has already been 
    // submitted on a form file
    app.post('/' + global.config.version + '/activity/form_transaction/check/v1', function (req, res) {
        // 
        // Check if a form transaction with a specific form_id has already 
        // been submitted on a form file
        activityCommonService
            .getActivityTimelineTransactionByFormId713(req.body, req.body.activity_id, req.body.form_id)
            .then((data) => {
                res.send(responseWrapper.getResponse(false, data, 200, req.body));
            })
            .catch((err) => {
                let data = {};
                res.send(responseWrapper.getResponse(err, data, -9998, req.body));
            });
    });

    // List of forms with data submitted on the queue mapped activity
    app.post('/' + global.config.version + '/activity/timeline/form/list', function (req, res) {
        // 
        // List of forms with data submitted on the queue mapped activity
        activityCommonService
            .getActivityTimelineTransactionByFormId(req.body, req.body.activity_id, req.body.form_id)
            .then((data) => {
                res.send(responseWrapper.getResponse(false, data, 200, req.body));
            })
            .catch((err) => {
                let data = {};
                res.send(responseWrapper.getResponse(err, data, -9998, req.body));
            });
    });

    // [Vodafone Service] DUMMY SERVICE | For all retieving all forms associated 
    // with a new order form_id
    /*
    app.post('/' + global.config.version + '/activity/category/form/mapping', function (req, res) {
        // 
        if (Number(req.body.form_id) === 873) {
            // BETA
            res.send(responseWrapper.getResponse(false, {
            	"New Order Details":873,
                "Order Supplementary Details": 874,
                "CRM Details": 870,
                "FR Details": 871, 
                "BC/HLD Documents":889,
                "HLD": 869,
                "New Customer Documents": 880,
                "Existing Customer Documents": 881,
                "CAF Form": 872,
                "OMT Approval": 883,  
                "Account Manager Approval": 875, 
                "Customer IT Approval":885,
                "Customer Authorized Signatory Approval":887,
                "Customer Management Approval": 882,
                "CRM_Acknowledgement": 868
            }, 200, req.body));

        } else if (Number(req.body.form_id) === 856) {
            // LIVE
            res.send(responseWrapper.getResponse(false, {
            	"New Order Details":856,
                "Order Supplementary Details": 857,
                "CRM Details": 865,
                "FR Details": 866, 
                "BC/HLD Documents":888,
                "HLD": 864,
                "New Customer Documents": 876,
                "Existing Customer Documents": 877,
                "CAF Form": 867,
                "OMT Approval": 879,   
                "Account Manager Approval": 858,
                "Customer IT Approval":884,
                "Customer Authorized Signatory Approval":886,
                "Customer Management Approval": 878,
                "CRM_Acknowledgement": 863
            }, 200, req.body));

        } else {
            res.send(responseWrapper.getResponse(true, {
                error: "Some parameter is incorrect."
            }, -9998, req.body));
        }
    }); */
    
    app.post('/' + global.config.version + '/activity/category/form/mapping', function (req, res) {
    	activityListingService.getFormList(req.body).then((data)=>{   
    		
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -9998, req.body));
        	});
    }); 
    
    
    app.post([('/' + global.config.version + '/activity/form/validation/data'),
        ('/' + global.config.version + '/form/field/validation/collection')
    ], function (req, res) {

        activityListingService.getActivityFormFieldValidationData(req.body).then((data) => {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));

        }).catch((err) => {
            data = {};
            res.send(responseWrapper.getResponse(err, data, -999, req.body));

        });
    });
    
    app.post('/' + global.config.version + '/activity/my_queue/list', function (req, res) {
    	activityListingService.getMyQueueActivitiesV2(req.body).then((data)=>{   
    		
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -9998, req.body));
        	});
    }); 
    
    app.post('/' + global.config.version + '/activity/my_queue/list/differential', function (req, res) {
        activityListingService.getMyQueueActivitiesDifferential(req.body).then((data) => {

            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.send(responseWrapper.getResponse(err, data, -9998, req.body));
        });
    });
    
    // Fetch Activity Details based on activity_id - To show the queue status - VODAFONE
    app.post('/' + global.config.version + '/activity/list', function (req, res) {
        activityListingService.fetchActivityDetails(req.body).then((data) => {
                (data.length > 0) ?
                    res.send(responseWrapper.getResponse(false, data, 200, req.body)):
                    res.send(responseWrapper.getResponse(false, {}, 200, req.body))
            }).catch((err) => {                
                let data = {};
                res.send(responseWrapper.getResponse(err, data, -9998, req.body));
            });
    });
    
    app.post('/' + global.config.version + '/queue/mapping/activity_type/list', function (req, res) {
    	activityListingService.getEntityQueueMapping(req.body).then((data)=>{    
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));    	
    	}).catch((err) => {        	
        	res.send(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/queue/activity/mapping/desk/list', function (req, res) {
    	activityListingService.getMyQueueActivitiesV2(req.body).then((data)=>{ 
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -9998, req.body));
        	});
    });
    
    app.post('/' + global.config.version + '/activity/mapping/queue/list', function (req, res) {
    	activityCommonService.fetchActivitiesMappedToQueue(req.body).then((data)=>{    
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));    	
    	}).catch((err) => {        	
        	res.send(responseWrapper.getResponse(err, {}, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/activity/form/transaction/data', async (req, res) => {        
        try {
            let result = await activityCommonService.getFormDataByFormTransaction(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });
}

module.exports = ActivityListingController;
