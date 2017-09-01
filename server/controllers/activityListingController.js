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
        req.body['module'] = 'activity';
        activityListingService.getActivityListDifferential(req.body, function (err, data, statusCode) {
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

    app.post('/' + global.config.version + '/activity/inline/collection', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.getActivityInlineCollection(req.body, function (err, data, statusCode) {
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
    
    app.post('/' + global.config.version + '/activity/cover/collection', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.getActivityCoverCollection(req.body, function (err, data, statusCode) {
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
    
    app.post('/' + global.config.version + '/activity/coworker/access/organization/list', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.getCoworkers(req.body, function (err, data, statusCode) {
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

    app.post('/' + global.config.version + '/activity/contact/access/asset/list', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.getSharedContacts(req.body, function (err, data, statusCode) {
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


    app.post('/' + global.config.version + '/activity/access/asset/search', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.searchActivityByType(req.body, function (err, data, statusCode) {
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


    app.post('/' + global.config.version + '/activity/contact/access/asset/search', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.searchSharedContacts(req.body, function (err, data, statusCode) {
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
    
    app.post('/' + global.config.version + '/activity/mail/access/asset/search', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.searchMail(req.body, function (err, data, statusCode) {
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
    
    app.post('/' + global.config.version + '/activity/stats/duevstotal/collection', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.getDuevsTotal(req.body, function (err, data, statusCode) {
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
    
    app.post('/' + global.config.version + '/activity/access/asset/filter/daterange', function (req, res) {
        req.body['module'] = 'activity';
        activityListingService.getActivityListDateRange(req.body, function (err, data, statusCode) {
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




}


module.exports = ActivityListingController;