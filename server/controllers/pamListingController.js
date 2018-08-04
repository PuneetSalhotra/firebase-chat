/*
 *author: Nani Kalyan V
 * 
 */

var PamListingService = require("../services/pamListingService");

function PamListingController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var pamListingService = new PamListingService(objCollection);
           
    app.post('/' + global.config.version + '/pam/orders/access/list', function (req, res) {
        pamListingService.getOrdersUnderAReservation(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/asset/access/account/list', function (req, res) {
        pamListingService.assetAccountListDiff(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));

            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    
    app.post('/' + global.config.version + '/pam/event/report', function (req, res) {
        pamListingService.eventReport(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/event/payment/export', function (req, res) {
        res.send(responseWrapper.getResponse(false, {}, 200, req.body));
    });

    
    app.post('/' + global.config.version + '/pam/asset/timeline/list', function (req, res) {
        pamListingService.assetTimeline(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/asset/favourite/orders', function (req, res) {
    	pamListingService.getFavouriteOrdersOfMember(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    		
    });
    
    app.post('/' + global.config.version + '/pam/asset/category/activities', function (req, res) {
    	pamListingService.getCategoryActivitiesOfAsset(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    		
    });
    
    app.post('/' + global.config.version + '/pam/activity/participants/category', function (req, res) {
    	pamListingService.getActivityParticipantsCategory(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        	});    		
    });
    
    app.post('/' + global.config.version + '/pam/activity/list/category', function (req, res) {
    	pamListingService.getActivityListCategory(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        	});    		
    });
    
    app.post('/' + global.config.version + '/pam/member/visit/history', function (req, res) {
    	pamListingService.getMemberEventVisitHistory(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    		
    });
    
}
;
module.exports = PamListingController;
