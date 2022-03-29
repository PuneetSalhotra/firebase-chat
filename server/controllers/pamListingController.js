/*
 *author: Nani Kalyan V
 * 
 */

let PamListingService = require("../services/pamListingService");

function PamListingController(objCollection) {

    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    let util = objCollection.util;
    let pamListingService = new PamListingService(objCollection);
           
    app.post('/' + global.config.version + '/pam/orders/access/list', function (req, res) {
        pamListingService.getOrdersUnderAReservation(req.body, function (err, data, statusCode) {
            if (err === false) {                
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/asset/access/account/list', function (req, res) {
        pamListingService.assetAccountListDiff(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));

            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/event/payment/export', function (req, res) {
        res.json(responseWrapper.getResponse(false, {}, 200, req.body));
    });

    
    app.post('/' + global.config.version + '/pam/asset/timeline/list', function (req, res) {
        pamListingService.assetTimeline(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/asset/favourite/orders', function (req, res) {
    	pamListingService.getFavouriteOrdersOfMember(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    		
    });
    
    app.post('/' + global.config.version + '/pam/asset/category/activities', function (req, res) {
    	pamListingService.getCategoryActivitiesOfAsset(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    		
    });
    
    app.post('/' + global.config.version + '/pam/activity/participants/category', function (req, res) {
    	pamListingService.getActivityParticipantsCategory(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        	});    		
    });
    
    app.post('/' + global.config.version + '/pam/activity/list/category', function (req, res) {
    	pamListingService.getActivityListCategory(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        	});    		
    });
    
    app.post('/' + global.config.version + '/pam/member/visit/history', function (req, res) {
    	pamListingService.getMemberEventVisitHistory(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    		
    });
    
    app.post('/' + global.config.version + '/pam/category/activities/list', function (req, res) {
    	pamListingService.getActivitiesAllCategories(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        	});
    		
    });
    
    app.post('/' + global.config.version + '/pam/activity/access/account/list', function (req, res) {
        pamListingService.getActivityAssetCategoryDifferential(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                console.log('did not get proper response');
                //global.logger.write('response', 'did not get proper response', err, req.body);
                util.logError(req.body,`getActivityAssetCategoryDifferential response did not get proper response Error %j`, { err,body : req.body });
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/activity/access/account/list/count', function (req, res) {
    	pamListingService.getActivityAssetCategoryDifferentialCount(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });
    		
    });
    
    app.post('/' + global.config.version + '/pam/asset/access/account/list', function (req, res) {
        pamListingService.assetAccountListCategoryDiff(req.body, function (err, data, statusCode) {
            if (err === false) {
                // got positive response    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));

            } else {
                //console.log('did not get proper rseponse');
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    app.post('/' + global.config.version + '/pam/asset/access/account/list/count', function (req, res) {
    	pamListingService.assetAccountListCategoryDiffCount(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });     
 
    app.post('/' + global.config.version + '/pam/activity/stock/list', function (req, res) {
    	pamListingService.activityAssetMappingCategorySearch(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/activity/timeline/list', function (req, res) {
        pamListingService.activityTimeline(req.body, function (err, data, statusCode) {
            if (err === false) {    
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {                
                data = {};
                res.json(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });

    app.post('/' + global.config.version + '/pam/order/average/times', function (req, res) {
    	pamListingService.averages(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });

    app.post('/' + global.config.version + '/pam/most/ordered', function (req, res) {
    	pamListingService.mostOrdered(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });    

    app.post('/' + global.config.version + '/pam/event/bill/groupby', function (req, res) {
    	pamListingService.billByItemType(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    }); 

    app.post('/' + global.config.version + '/pam/date/events', function (req, res) {
    	pamListingService.getEventBydate(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    }); 
    
    app.post('/' + global.config.version + '/pam/asset/details', function (req, res) {
    	pamListingService.getAssetDetails(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/event/payment/collection', function (req, res) {
    	pamListingService.billingAmountByPaymentType(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/event/inventory/consumption', function (req, res) {
    	pamListingService.getInventoryConsumption(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/user/authenticate', function (req, res) {
    	pamListingService.userAuthenticate(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/covers/between/dates', function (req, res) {
    	pamListingService.coversBetweenDates(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/get/activity/cover', function (req, res) {
    	pamListingService.getActivityDetails(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/member/visited/count', function (req, res) {
    	pamListingService.getMemberVisitedCount(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/reservation/level/billing', function (req, res) {
    	pamListingService.getReservationWiseBilling(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/member/reservation/list', function (req, res) {
    	pamListingService.getMemberReservations(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
   app.post('/' + global.config.version + '/pam/reservation/order/list', function (req, res) {
    	pamListingService.getReservationOrders(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/members/unpaid/list', function (req, res) {
    	pamListingService.getUnpaidReservations(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/date/event/datetime', function (req, res) {
    	pamListingService.getEventBydatetime(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    }); 
    
    app.post('/' + global.config.version + '/pam/event/reservation/list/search', function (req, res) {
    	pamListingService.getReservationListSearch(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    }); 
    
    app.post('/' + global.config.version + '/pam/event/covers', function (req, res) {
    	pamListingService.getEventCovers(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    
    app.post('/' + global.config.version + '/pam/activity_type/order/list', async function (req, res) {
        const [err, data] = await pamListingService.pamOrderListSelectActivityType(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }

    });
    
    app.post('/' + global.config.version + '/pam/first/level/tag/list', async function (req, res) {
        const [err, data] = await pamListingService.getFirstLevelTags(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });
    
    app.post('/' + global.config.version + '/pam/sub/level/tag/list', async function (req, res) {
        const [err, data] = await pamListingService.getSubLevelMenuTags(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
    
    app.post('/' + global.config.version + '/pam/tag/menu/list', async function (req, res) {
        const [err, data] = await pamListingService.getMenuLinkedtoParticularTag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
    app.post('/' + global.config.version + '/pam/retrieve/menuitem/custom/tag', async function (req, res) {
        const [err, data] = await pamListingService.getCustomTagsLinkedToMenuItem(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
    app.post('/' + global.config.version + '/pam/retrieve/custom/choices', async function (req, res) {
        const [err, data] = await pamListingService.getMenuItemsLinkedToCustomTag(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
    
    app.post('/' + global.config.version + '/pam/table/details', function (req, res) {
    	pamListingService.getTableDetails(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });

    //Get PAM Role Module Mapping Details for the given asset_type_id
    app.post('/' + global.config.version + '/pam/role/module/mapping', function (req, res) {
    	pamListingService.getPamRoleModuleMappingDetails(req.body).then((data)=>{   
    		//console.log(data);
    		res.json(responseWrapper.getResponse({}, data, 200, req.body));
    	}).catch((err) => { 
    		data = {};
    		res.json(responseWrapper.getResponse(err, data, -999, req.body));
        });    		
    });
    app.post('/' + global.config.version + '/pam/activity/category/children', async function (req, res) {
        const [err, data] = await pamListingService.listSelectParentActivity(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
    app.post('/' + global.config.version + '/pam/reservation/status/track', async function (req, res) {
        const [err, data] = await pamListingService.getReservationStatusTrack(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
    app.post('/' + global.config.version + '/pam/get/cashandcaryy/order', async function (req, res) {
        const [err, data] = await pamListingService.listSelectCashandcarry(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
    app.post('/' + global.config.version + '/pam/get/event/reserved/tables', async function (req, res) {
        const [err, data] = await pamListingService.getEventReservedTables(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/pam/get/event/reserved/tables Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });
    app.post('/' + global.config.version + '/pam/get/discount/promocode', async function (req, res) {
        const [err, data] = await pamListingService.getDiscountPromocode(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/pam/get/discount/promocode Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
    
    app.post('/' + global.config.version + '/pam/tag/menu/list/v1', async function (req, res) {
        const [err, data] = await pamListingService.getMenuLinkedtoParticularTagV1(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
  
    app.post('/' + global.config.version + '/pam/table/orders/list', async function (req, res) {
        const [err, data] = await pamListingService.getTableOrders(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/pam/table/orders/list Error: ", err)
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });	
     
};
module.exports = PamListingController;
