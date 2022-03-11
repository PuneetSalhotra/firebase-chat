/*
 *author: Sri Sai Venkatesh 
 * 
 */

let ActivityListingService = require("../services/activityListingService");
const moment = require('moment');
const logger = require("../logger/winstonLogger");
function ActivityListingController(objCollection) {

    let responseWrapper = objCollection.responseWrapper;
    let cacheWrapper = objCollection.cacheWrapper;
    const activityCommonService = objCollection.activityCommonService;
    let app = objCollection.app;
    let queueWrapper = objCollection.queueWrapper;
    let util = objCollection.util;

    let activityListingService = new ActivityListingService(objCollection);

    app.post('/' + global.config.version + '/activity/access/asset/list', function (req, res) {
        activityListingService.getActivityListDifferential(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getActivityListDifferential response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //PAM
    app.post('/' + global.config.version + '/activity/access/account/list', function (req, res) {
        activityListingService.getActivityAssetAccountLevelDifferential(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getActivityAssetAccountLevelDifferential response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/inline/collection', function (req, res) {
        activityListingService.getActivityInlineCollection(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getActivityInlineCollection response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/cover/collection', function (req, res) {
        activityListingService.getActivityCoverCollection(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getActivityCoverCollection response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/cover/collection/v1', function (req, res) {
        activityListingService.getActivityCoverCollectionV1(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getActivityCoverCollectionV1 response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });


    app.post('/' + global.config.version + '/activity/coworker/access/organization/list', function (req, res) {
        activityListingService.getCoworkers(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getCoworkers response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    /*
    app.post('/' + global.config.version + '/activity/contact/access/asset/list', function (req, res) {
        activityListingService.getSharedContacts(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper response');
                global.logger.write('response','did not get proper response',err,req.body);
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    */

    app.post('/' + global.config.version + '/activity/access/asset/search', function (req, res) {
        activityListingService.searchActivityByType(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`searchActivityByType response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });


    app.post('/' + global.config.version + '/activity/contact/access/asset/search', function (req, res) {
        activityListingService.searchSharedContacts(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`searchSharedContacts response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/contact/access/asset/list', function (req, res) {
        activityListingService.listContacts(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`listContacts response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/mail/access/asset/search', function (req, res) {
        activityListingService.searchMail(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`searchMail response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/stats/duevstotal/collection', function (req, res) {
        activityListingService.getDuevsTotal(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response  
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getDuevsTotal response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/access/asset/filter/daterange', function (req, res) {
        activityListingService.getActivityListDateRange(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response  
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getActivityListDateRange response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/all-contact/access/asset/list', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.getAllContactTypes(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper rseponse');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getAllContactTypes response Did not get a proper response Error %j`, { err,body : req.body });

                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/all-contact/access/asset/search', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.searchAllContactTypes(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper rseponse');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`searchAllContactTypes response Did not get a proper response Error %j`, { err,body : req.body });

                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //BETA
    app.post('/' + global.config.version + '/activity/video_conference/access/asset/list', function (req, res) {
        activityListingService.getVideoConfSchedule(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper rseponse');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getVideoConfSchedule response Did not get a proper response Error %j`, { err,body : req.body });

                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //BETA
    app.post('/' + global.config.version + '/activity/meeting_room/access/search', function (req, res) {
        activityListingService.getOptimumMeetingRoom(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper rseponse');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getOptimumMeetingRoom response Did not get a proper response Error %j`, { err,body : req.body });

                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //BETA
    app.post('/' + global.config.version + '/activity/access/folder/list', function (req, res) {
        activityListingService.getAllFolders(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper rseponse');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getAllFolders response Did not get a proper response Error %j`, { err,body : req.body });

                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //BETA
    app.post('/' + global.config.version + '/activity/access/project/list', function (req, res) {
        activityListingService.getAllProjects(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper rseponse');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getAllProjects response Did not get a proper response Error %j`, { err,body : req.body });

                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Get the count of all Folders, mail, video calls etc
    app.post('/' + global.config.version + '/asset/access/counts/list', function (req, res) {
        activityListingService.getAllPendingCounts(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    //badge count service
    app.post('/' + global.config.version + '/asset/access/counts/list/V1', function (req, res) {
        activityListingService.getAllPendingCountsV1(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });


    //Get the counts on task lists (explicitly for task list)
    app.post('/' + global.config.version + '/asset/access/tasklist/counts/list', function (req, res) {
        activityListingService.getTaskListCounts(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    //Get the count of tasks     
    app.post('/' + global.config.version + '/asset/access/pending_task/count', function (req, res) {
        activityListingService.pendingInmailCount(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Get the overall ToDo tasks where I am not collaborator (BAck ward compatability)
    app.post('/' + global.config.version + '/asset/access/task/list', function (req, res) {
        activityListingService.getTasks(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset/access/task/list/v1', function (req, res) {
        activityListingService.getTasksV1(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });


    //Get the count of tasks 
    app.post('/' + global.config.version + '/asset/access/pending_task/count', function (req, res) {
        activityListingService.pendingInmailCount(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Get the overall ToDo tasks where I am not collaborator (BAck ward compatability)
    app.post('/' + global.config.version + '/asset/access/task/list', function (req, res) {
        activityListingService.getTasks(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Get the count of all Folders, mail, video calls etc
    app.post('/' + global.config.version + '/activity/access/asset/payroll/list', function (req, res) {
        activityListingService.getLatestPayrollActivity(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //
    app.post('/' + global.config.version + '/activity/access/asset/category/search', function (req, res) {
        activityListingService.searchActivityByCategory(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //Get the count of all tasks of an asset in a project
    app.post('/' + global.config.version + '/asset/tasks_project/access/counts/list', function (req, res) {
        activityListingService.getAssetTasksInProjCount(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/asset/phonenumber/access/organization/list', function (req, res) {
        activityListingService.getOrganizationsOfANumber(req.headers, req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
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
            res.json(responseWrapper.getResponse(true, data, -3308, req.body));
            return;
        }
        // 2. If the search-with-string flag is set, there must be a valid search string
        if (Number(req.body.flter_flag) === 11) {
            if (typeof req.body.search_string === 'undefined' || req.body.search_string === '') {
                let data = 'Search flag set, but invalid/empty search string found.';
                res.json(responseWrapper.getResponse(true, data, -3309, req.body));
                return;
            }
        }
        // 
        // Fetch list of meetings
        activityListingService.listMeetingsByDateRangeOrSearchString(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
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
            res.json(responseWrapper.getResponse(true, data, -3308, req.body));
            return;
        }
        // 2. If the search-with-string flag is set, there must be a valid search string
        if (Number(req.body.flter_flag) === 11) {
            if (typeof req.body.search_string === 'undefined' || req.body.search_string === '') {
                let data = 'Search flag set, but invalid/empty search string found.';
                res.json(responseWrapper.getResponse(true, data, -3309, req.body));
                return;
            }
        }
        // 
        // Fetch count of meetings
        activityListingService.countOfMeetingsByDateRangeOrSearchString(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
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
            res.json(responseWrapper.getResponse(true, data, -3206, req.body));
            return;
        }
        // 
        // Verify if chat exists
        activityListingService.checkIfChatExists(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    // Fetch list of recent chats for the asset
    app.post('/' + global.config.version + '/asset/access/chat/list', function (req, res) {
        // 
        // Fetch list of recent chats for the asset
        activityListingService.fetchRecentChatList(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
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
                res.json(responseWrapper.getResponse(false, data, 200, req.body));
            })
            .catch((err) => {
                let data = {};
                res.json(responseWrapper.getResponse(err, data, -9998, req.body));
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
                res.json(responseWrapper.getResponse(false, data, 200, req.body));
            })
            .catch((err) => {
                let data = {};
                res.json(responseWrapper.getResponse(err, data, -9998, req.body));
            });
    });

    // List of forms with data submitted on the queue mapped activity
    app.post('/' + global.config.version + '/activity/timeline/form/list', function (req, res) {
        // 
        // List of forms with data submitted on the queue mapped activity
        activityCommonService
            .getActivityTimelineTransactionByFormId(req.body, req.body.activity_id, req.body.form_id)
            .then((data) => {
                res.json(responseWrapper.getResponse(false, data, 200, req.body));
            })
            .catch((err) => {
                let data = {};
                res.json(responseWrapper.getResponse(err, data, -9998, req.body));
            });
    });

    // [Vodafone Service] DUMMY SERVICE | For all retieving all forms associated 
    // with a new order form_id
    /*
    app.post('/' + global.config.version + '/activity/category/form/mapping', function (req, res) {
        // 
        if (Number(req.body.form_id) === 873) {
            // BETA
            res.json(responseWrapper.getResponse(false, {
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
            res.json(responseWrapper.getResponse(false, {
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
            res.json(responseWrapper.getResponse(true, {
                error: "Some parameter is incorrect."
            }, -9998, req.body));
        }
    }); */

    app.post('/' + global.config.version + '/activity/category/form/mapping', function (req, res) {
        activityListingService.getFormList(req.body).then((data) => {

            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.json(responseWrapper.getResponse(err, data, -9998, req.body));
        });
    });


    app.post('/' + global.config.version + '/activity/form/validation/data', function (req, res) {

        activityListingService.getActivityFormFieldValidationData(req.body).then((data) => {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));

        }).catch((err) => {
            data = {};
            res.json(responseWrapper.getResponse(err, data, -999, req.body));

        });
    });

    app.post('/' + global.config.version + '/form/field/validation/collection', function (req, res) {

        activityListingService.getActivityFormFieldValidationData(req.body).then((data) => {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));

        }).catch((err) => {
            console.log('ERR in /form/field/validation/collection : ', err);
            //data = {};
            res.json(responseWrapper.getResponse(err, {}, -999, req.body));

        });
    });

    app.post('/' + global.config.version + '/activity/my_queue/list', function (req, res) {
        activityListingService
            .getMyQueueActivitiesV2(req.body)
            .then((data) => {
                res.json(responseWrapper.getResponse({}, data, 200, req.body));
            }).catch((err) => {
                data = {};
                res.json(responseWrapper.getResponse(err, data, -9998, req.body));
            });
    });

    app.post('/' + global.config.version + '/activity/my_queue/list/differential', function (req, res) {
        activityListingService.getMyQueueActivitiesDifferential(req.body).then((data) => {

            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.json(responseWrapper.getResponse(err, data, -9998, req.body));
        });
    });

    // Fetch Activity Details based on activity_id - To show the queue status - VODAFONE
    app.post('/' + global.config.version + '/activity/list', function (req, res) {
        activityListingService.fetchActivityDetails(req.body).then((data) => {
            (data.length > 0) ?
                res.json(responseWrapper.getResponse(false, data, 200, req.body)) :
                res.json(responseWrapper.getResponse(false, {}, 200, req.body))
        }).catch((err) => {
            let data = {};
            res.json(responseWrapper.getResponse(err, data, -9998, req.body));
        });
    });

    app.post('/' + global.config.version + '/queue/mapping/activity_type/list', function (req, res) {
        activityListingService.getEntityQueueMapping(req.body).then((data) => {
            //console.log(data);
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            res.json(responseWrapper.getResponse(err, {}, -999, req.body));
        });
    });

    app.post('/' + global.config.version + '/queue/activity/mapping/desk/list', function (req, res) {
        activityListingService.getMyQueueActivitiesV2(req.body).then((data) => {
            //console.log(data);
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            data = {};
            res.json(responseWrapper.getResponse(err, data, -9998, req.body));
        });
    });

    app.post('/' + global.config.version + '/activity/mapping/queue/list', function (req, res) {
        activityCommonService.fetchActivitiesMappedToQueue(req.body).then((data) => {
            //console.log(data);
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        }).catch((err) => {
            res.json(responseWrapper.getResponse(err, {}, -999, req.body));
        });
    });

    app.post('/' + global.config.version + '/activity/form/transaction/data', async (req, res) => {
        try {
            let result = await activityCommonService.getFormDataByFormTransaction(req.body);
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } catch (err) {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    // Fetch all queues
    // A queue can be at organization, workforce or account level
    app.post('/' + global.config.version + '/asset/queue/activity/list', function (req, res) {
        // 
        // Check if a form transaction with a specific form_id has already 
        // been submitted on a form file
        // activityCommonService
        //     .fetchActivitiesMappedToQueue(req.body)
        //     .then((data) => {
        //         res.json(responseWrapper.getResponse(false, data, 200, req.body));
        //     })
        //     .catch((err) => {
        //         let data = {};
        //         res.json(responseWrapper.getResponse(err, data, -9998, req.body));
        //     });
        activityListingService
            .fetchActivitiesMappedToQueueWithParticipants(req.body)
            .then((data) => {
                res.json(responseWrapper.getResponse({}, data, 200, req.body));
            }).catch((err) => {
                console.log(err);
                data = {};
                res.json(responseWrapper.getResponse(err, data, -9998, req.body));
            });
    });

    // Fetch queue activities specific to the user
    // A queue can be at organization, workforce or account level
    app.post('/' + global.config.version + '/asset/queue/activity/user_filter/list', async function (req, res) {
        // 
        const [err, childOrderData] = await activityListingService.getQueueActivitiesWithUserFilter(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, childOrderData, 200, req.body));
        } else {
            console.log("/asset/queue/activity/user_filter/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, childOrderData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/queue/list/all', function (req, res) {
        activityListingService
            .getQueueActivitiesAllFilters(req.body)
            .then((data) => {
                res.json(responseWrapper.getResponse({}, data, 200, req.body));
            }).catch((err) => {
                data = {};
                res.json(responseWrapper.getResponse(err, data, -9998, req.body));
            });
    });


    // Flag=0: Get the count of child orders which are open in a given bulk order
    // Flag=1: Get the list of child orders in a given bulk order
    // ....... sort_flag=0: sorted by activity_datetime_created
    // ....... sort_flag=1: sorted by activity_datetime_end_deferred
    app.post('/' + global.config.version + '/activity/workflow/child_orders/list', async function (req, res) {
        const [err, childOrderData] = await activityListingService.activityListSelectChildOrdersBasedOnAssetAccess(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, childOrderData, 200, req.body));
        } else {
            console.log("/activity/workflow/child_orders/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, childOrderData, -9999, req.body));
        }
    });


    app.post('/' + global.config.version + '/activity/form/download/attachements', function (req, res) {
        activityListingService.downloadZipFile(req.body).then((data) => {
            res.json(responseWrapper.getResponse({}, data[1], 200, req.body));
        }).catch((err) => {
            let data = {};
            res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });
    });

    app.post('/' + global.config.version + '/activity/queue/list/all/v1', function (req, res) {
        activityListingService
            .getQueueActivitiesAllFiltersV1(req.body)
            .then((data) => {
                res.json(responseWrapper.getResponse({}, data, 200, req.body));
            }).catch((err) => {
                data = {};
                res.json(responseWrapper.getResponse(err, data, -9998, req.body));
            });
    });

    app.post('/' + global.config.version + '/activity/widget_values/list', async (req, res) => {
        const [err, result] = await activityListingService.getWidgetValues(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            console.log("/activity/widget_values/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/bot/workflow_references/list', async (req, res) => {
        const [err, result] = await activityListingService.getWorkflowReferenceBots(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            console.log("/bot/workflow_references/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });


    app.post('/' + global.config.version + '/activity/lead/workflow/list', async function (req, res) {
        const [err, responseData] = await activityListingService.getLeadAssetWorkload(req.body, req.body.lead_asset_id);
        if (!err) {
            res.json(responseWrapper.getResponse(responseData, responseData, 200, req.body));
        } else {
            console.log("'/activity/lead/workflow/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, { message: err.getMessage() }, err.getErrorCode(), req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/sub_status/list', async function (req, res) {
        const [err, responseData] = await activityListingService.getActivitySubStatuses(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("'/activity/sub_status/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    //Contacts Visibility at workflow level
    app.post('/' + global.config.version + '/activity-activity/mapping/child-activities/list', async (req, res) => {
        const [err, responseData] = await activityListingService.getActActChildActivities(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity-activity/mapping/child-activities/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/asset/mapping/new-filters/list', async (req, res) => {
        const [err, responseData] = await activityListingService.actAssetMappingNewFiltersList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/asset/mapping/new-filters/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/details/list', async (req, res) => {
        const [err, responseData] = await activityListingService.getActivityDetails(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/details/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    //With V1 old one actually bypasses the authentiation layer
    //Hence we started using V1 to support cognito
    app.post('/' + global.config.version + '/asset/phonenumber/access/organization/list/v1', (req, res) => {
        activityListingService.getOrganizationsOfANumber(req.headers, req.body, (err, data, statusCode) => {
            //statusCode = -3204;
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/access/asset/list/v1', function (req, res) {
        activityListingService.getActivityListDifferential(req.body, function (err, data, statusCode) {
            //statusCode = -3204;
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getActivityListDifferential response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/access/asset/list/v2', function (req, res) {
        activityListingService.getActivityListDifferentialV2(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getActivityListDifferentialV2 response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/category/search/list', async (req, res) => {
        const [err, responseData] = await activityListingService.getActivityCategorySearch(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/category/search/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });
    app.post('/' + global.config.version + '/workflow/activity-reference/list', async (req, res) => {
        const [err, workforceTypeData] = await activityListingService.getActReferenceList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, workforceTypeData, 200, req.body));
        } else {
            console.log("/admin/workforce_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, workforceTypeData, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/workflow/child-products/list', async (req, res) => {
        const [err, workforceTypeData] = await activityListingService.getChildProductsList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, workforceTypeData, 200, req.body));
        } else {
            console.log("/admin/workforce_type/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, workforceTypeData, -9999, req.body));
        }
    });

    //Contacts Visibility at workflow level - TAG Level
    app.post('/' + global.config.version + '/activity-activity/mapping/child-activities/list/v1', async (req, res) => {
        const [err, responseData] = await activityListingService.getActActChildActivitiesV1(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity-activity/mapping/child-activities/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/asset/focus-list', async (req, res) => {
        const [err, responseData] = await activityListingService.getActivityFocusList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/asset/focus/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/asset/focus-list/v1', async (req, res) => {
        const [err, responseData] = await activityListingService.getActivityFocusListV1(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/asset/focus/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/search/list', async (req, res) => {
        const [err, responseData] = await activityListingService.getActivitySearchList(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/search/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/queue/list/all/v2', async (req, res) => {
        const [err, responseData] = await activityListingService.getQueueActMappingAssetFlag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/queue/list/all/v2 | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/target/chat', async (req, res) => {
        const [err, responseData] = await activityListingService.getChatWithAResource(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/target/chat | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/access/asset/list/v3', function (req, res) {
        activityListingService.getActivityListDifferential(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                // console.log('did not get proper response');
                //global.logger.write('response', 'Did not get a proper response', err, req.body);
                util.logError(req.body,`getActivityListDifferential response Did not get a proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    //We started using V2 so that we can send -3204 in V1 and force the users to upgrade to the latest App
    app.post('/' + global.config.version + '/asset/phonenumber/access/organization/list/v2', (req, res) => {
        activityListingService.getOrganizationsOfANumber(req.headers, req.body, (err, data, statusCode) => {
            if (err === false) {
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/bulk-summary/list', async (req, res) => {
        const [err, responseData] = await activityListingService.getActBulkSummaryData(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/bulk-summary/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/bulk-summary/list/v1', async (req, res) => {

        const rateLimitExists = await cacheWrapper.checkBulkFeasibilitySummaryReportRateLimitExists(req.body);
        if (Number(rateLimitExists)) {
            logger.debug(`${req.body.parent_activity_id} | Bulk feasibility summary request job in progress!`, { req, dupe_check: "RATE_LIMIT_EXISTS" });
            res.json(responseWrapper.getResponse(false, [{ message: "Too many requests received. Please wait sometime to resubmit again." }], 200, req.body));
            return;
        }
        let activityTypeID = req.body.activity_type_id || 0;
        if (activityTypeID === 190797 || activityTypeID === 191879 || activityTypeID === 197905) {
            activityListingService.generateSummary(req.body);
            const isRateLimitSet = await cacheWrapper.setBulkFeasibilitySummaryReportRateLimitWithExpiry(req.body, 60);
            res.json(responseWrapper.getResponse(false, [{ message: "The summary is being generated and will be available on the timeline shortly!" }], 200, req.body));

        } else {
            let bulkSummaryExtractTopicName = "";
            switch (global.mode) {
                case "local":
                    bulkSummaryExtractTopicName = "local-vil-bulk-summary-v1";
                    break;
                case "staging":
                    // Disabled for PreProd testing, because both staging and preprod
                    // share the same topic for integrations communication
                    // bulkSummaryExtractTopicName = "staging-vil-esms-ibmmq-v2";
                    break;
                case "preprod":
                    bulkSummaryExtractTopicName = "staging-vil-bulk-summary-v1";
                    break;
                case "prod":
                    bulkSummaryExtractTopicName = "production-vil-bulk-summary-v1";
                    break;
            }
            try {
                await queueWrapper.raiseActivityEventToTopicPromise({
                    type: "BULK_SUMMARY_DATA",
                    service_name: "EXTRACT_BULK_SUMMARY_DATA",
                    payload: req.body
                }, bulkSummaryExtractTopicName, req.body.parent_activity_id);
                const isRateLimitSet = await cacheWrapper.setBulkFeasibilitySummaryReportRateLimitWithExpiry(req.body, 60);
                res.json(responseWrapper.getResponse(false, [{ message: "The summary is being generated and will be available on the timeline shortly!" }], 200, req.body));
            } catch (error) {
                res.json(responseWrapper.getResponse(error, [{
                    message: "There was an error submitting the bulk feasibility summary generation request. Please try again."
                }], -9998, req.body));
            }

        }
    });

    app.post('/' + global.config.version + '/activity/email-summary/', async (req, res) => {
        try {
            activityListingService.emailSummary(req.body);
            res.json(responseWrapper.getResponse(false, [{ message: "The summary is being generated and will be sent via email shortly!" }], 200, req.body));
        } catch (e) {
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/retrieve/asset/access/role', async (req, res) => {
        try{
            const response = await activityCommonService.activityAssetMappingSelectActivityParticipant(req.body,req.activity_id);
            res.json(responseWrapper.getResponse(false, response, 200, req.body));
        }catch(err) {
            console.log("/retrieve/asset/access/role | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/retrieve/asset/access/role/V1', async (req, res) => {
        try{
            const response = await activityCommonService.activityAssetMappingSelectActivityParticipantWithStatus(req.body,req.activity_id);
            res.json(responseWrapper.getResponse(false, response, 200, req.body));
        }catch(err) {
            console.log("/retrieve/asset/access/role/V1 | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/form/data', async (req, res) => {
        try{
            const response = await activityListingService.getActivityFormList(req.body,req.activity_id);
            res.json(responseWrapper.getResponse(false, response, 200, req.body));
        }catch(err) {
            console.log("/activity/form/data | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });
    app.post('/' + global.config.version + '/activity/asset/participating/status/list', async (req, res) => {
        const [err, responseData] = await activityListingService.getActivityUserParticipatingStatus(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/asset/participating/status | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });
    app.post('/' + global.config.version + '/activity/status/workforce/list', async (req, res) => {
        const [err, responseData] = await activityListingService.getWorkflowBaseOnStatus(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/status/workforce/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });
    app.post('/' + global.config.version + '/activity/fetch/counts/list', async (req, res) => {
        const [err, responseData] = await activityListingService.getCountForFilters(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/fetch/counts/list | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });

    app.post('/' + global.config.version + '/activity/update/widgets', async (req, res) => {
        const [err, responseData] = await activityListingService.UpdateWidgetDetails(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse(false, responseData, 200, req.body));
        } else {
            console.log("/activity/update/widgets | Error: ", err);
            res.json(responseWrapper.getResponse(err, {}, -9998, req.body));
        }
    });


}

module.exports = ActivityListingController;
