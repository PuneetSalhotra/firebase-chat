/*
 *author: Sri Sai Venkatesh 
 * 
 */

var ActivityListingService = require("../services/activityListingService");
const moment = require('moment');

function ActivityListingController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;

    var activityListingService = new ActivityListingService(objCollection);

    app.post('/' + global.config.version + '/activity/access/asset/list', function (req, res) {
        activityListingService.getActivityListDifferential(req.body, function (err, data, statusCode) {
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
    
    //PAM
    app.post('/' + global.config.version + '/activity/access/account/list', function (req, res) {
        activityListingService.getActivityAssetAccountLevelDifferential(req.body, function (err, data, statusCode) {
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

    app.post('/' + global.config.version + '/activity/inline/collection', function (req, res) {
        activityListingService.getActivityInlineCollection(req.body, function (err, data, statusCode) {
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
    
    app.post('/' + global.config.version + '/activity/cover/collection', function (req, res) {
        activityListingService.getActivityCoverCollection(req.body, function (err, data, statusCode) {
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
    
    app.post('/' + global.config.version + '/activity/cover/collection/v1', function (req, res) {
        activityListingService.getActivityCoverCollectionV1(req.body, function (err, data, statusCode) {
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
    
    
    app.post('/' + global.config.version + '/activity/coworker/access/organization/list', function (req, res) {
        activityListingService.getCoworkers(req.body, function (err, data, statusCode) {
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
                console.log('did not get proper response');
                global.logger.write('response','did not get proper response',err,req.body);
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
                console.log('did not get proper response');
                global.logger.write('response','did not get proper response',err,req.body);
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
                console.log('did not get proper response');
                global.logger.write('response','did not get proper response',err,req.body);
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
                console.log('did not get proper response');
                global.logger.write('response','did not get proper response',err,req.body);
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
                console.log('did not get proper response');
                global.logger.write('response','did not get proper response',err,req.body);
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
                console.log('did not get proper response');
                global.logger.write('response','did not get proper response',err,req.body);
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
                console.log('did not get proper rseponse');
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
                console.log('did not get proper rseponse');
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
                console.log('did not get proper rseponse');
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
                console.log('did not get proper rseponse');
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
                console.log('did not get proper rseponse');
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
                console.log('did not get proper rseponse');
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
        activityListingService.listMeetingsByDateRangeOrSearchString(req.body, function (err, data, statusCode) {        
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
}

module.exports = ActivityListingController;
