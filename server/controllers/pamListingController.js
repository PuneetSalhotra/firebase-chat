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
    
    app.post('/' + global.config.version + '/pam/category/activities/list', function (req, res) {
    	pamListingService.getActivitiesAllCategories(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    		
    });
    
    app.post('/' + global.config.version + '/pam/activity/access/account/list', function (req, res) {
        pamListingService.getActivityAssetCategoryDifferential(req.body, function (err, data, statusCode) {
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
    
    app.post('/' + global.config.version + '/pam/activity/access/account/list/count', function (req, res) {
    	pamListingService.getActivityAssetCategoryDifferentialCount(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });
    		
    });
    
    app.post('/' + global.config.version + '/pam/asset/access/account/list', function (req, res) {
        pamListingService.assetAccountListCategoryDiff(req.body, function (err, data, statusCode) {
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
    
    app.post('/' + global.config.version + '/pam/asset/access/account/list/count', function (req, res) {
    	pamListingService.assetAccountListCategoryDiffCount(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });     
 
    app.post('/' + global.config.version + '/pam/activity/stock/list', function (req, res) {
    	pamListingService.activityAssetMappingCategorySearch(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/activity/timeline/list', function (req, res) {
        pamListingService.activityTimeline(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/order/average/times', function (req, res) {
    	pamListingService.averages(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });

    app.post('/' + global.config.version + '/pam/most/ordered', function (req, res) {
    	pamListingService.mostOrdered(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });    

    app.post('/' + global.config.version + '/pam/event/bill/groupby', function (req, res) {
    	pamListingService.billByItemType(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    }); 

    app.post('/' + global.config.version + '/pam/date/events', function (req, res) {
    	pamListingService.getEventBydate(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    }); 
    
    app.post('/' + global.config.version + '/pam/asset/details', function (req, res) {
    	pamListingService.getAssetDetails(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/event/payment/collection', function (req, res) {
    	pamListingService.billingAmountByPaymentType(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/event/inventory/consumption', function (req, res) {
    	pamListingService.getInventoryConsumption(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/user/authenticate', function (req, res) {
    	pamListingService.userAuthenticate(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/covers/between/dates', function (req, res) {
    	pamListingService.coversBetweenDates(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/get/activity/cover', function (req, res) {
    	pamListingService.getActivityDetails(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/member/visited/count', function (req, res) {
    	pamListingService.getMemberVisitedCount(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/reservation/level/billing', function (req, res) {
    	pamListingService.getReservationWiseBilling(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/member/reservation/list', function (req, res) {
    	pamListingService.getMemberReservations(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
   app.post('/' + global.config.version + '/pam/reservation/order/list', function (req, res) {
    	pamListingService.getReservationOrders(req.body).then((data)=>{   
    		//console.log(data);
    		res.send(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.send(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/members/unpaid/list', function (req, res) {
    	pamListingService.getUnpaidReservations(req.body).then((data)=>{   
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
