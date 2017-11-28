/*
 *author: Sri Sai Venkatesh 
 * 
 */

var ActivityListingService = require("../services/activityListingService");

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
                global.logger.write(1, 'response','did not get proper response - ' + err,req.body);
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
                global.logger.write(1, 'response','did not get proper response - ' + err,req.body);
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
                global.logger.write(1, 'response','did not get proper response - ' + err,req.body);
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
                global.logger.write(1, 'response','did not get proper response - ' + err,req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/activity/contact/access/asset/list', function (req, res) {
        activityListingService.getSharedContacts(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper response');
                global.logger.write(1, 'response','did not get proper response - ' + err,req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });


    app.post('/' + global.config.version + '/activity/access/asset/search', function (req, res) {
        activityListingService.searchActivityByType(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper response');
                global.logger.write(1, 'response','did not get proper response - ' + err,req.body);
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
                global.logger.write(1, 'response','did not get proper response - ' + err,req.body);
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
                global.logger.write(1, 'response','did not get proper response - ' + err,req.body);
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
                global.logger.write(1, 'response','did not get proper response - ' + err,req.body);
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
                global.logger.write(1, 'response','did not get proper response - ' + err,req.body);
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

}

module.exports = ActivityListingController;