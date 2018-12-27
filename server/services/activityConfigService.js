/*
 * author: Sri Sai Venkatesh
 */

function ActivityConfigService(db, util) {

    this.getWorkforceActivityTypesList = function (request, callback) {
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        var queryString = util.getQueryString('ds_v1_workforce_activity_type_mapping_select', paramsArr);

        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    // got data now parse it..                    

                    formatActivityTypesList(data, function (err, data) {
                        if (err === false)
                            callback(false, {
                                data: data
                            }, 200);
                    });
                    //callback(false, data, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }

    };

    this.getWorkforceActivityStatusList = function (request, callback) {

        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        var queryString = util.getQueryString('ds_v1_workforce_activity_status_mapping_select', paramsArr);

        //console.log(queryString);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    // got data now parse it..                    

                    formatActivityStatusList(data, function (err, data) {
                        if (err === false)
                            callback(false, {
                                data: data
                            }, 200);
                    });
                    //callback(false, data, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        };
    };

    this.getActivityParticipantAccess = function (request, callback) {
        var productId = (request.hasOwnProperty('product_id')) ? request.product_id : 1;
        var paramsArr = new Array(
            request.page_start,
            util.replaceQueryLimit(request.page_limit),
            productId
        );
        var queryString = util.getQueryString('ds_v1_1_activity_participant_access_master_select', paramsArr);

        //console.log(queryString);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    // got data now parse it..                    
                    callback(false, {
                        data: data
                    }, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        };
    };

    var formatActivityTypesList = function (data, callback) {
        var responseData = new Array();
        data.forEach(function (rowData, index) {

            var rowDataArr = {
                'activity_type_id': util.replaceDefaultNumber(rowData['activity_type_id']),
                'activity_type_name': util.replaceDefaultString(rowData['activity_type_name']),
                'activity_type_category_id': util.replaceDefaultNumber(rowData['activity_type_category_id']),
                'activity_type_category_name': util.replaceDefaultString(rowData['activity_type_category_name']),
                'workforce_id': util.replaceDefaultNumber(rowData['workforce_id']),
                'workforce_name': util.replaceDefaultString(rowData['workforce_name']),
                'account_id': util.replaceDefaultNumber(rowData['account_id']),
                'account_name': util.replaceDefaultString(rowData['account_name']),
                'organization_id': util.replaceDefaultNumber(rowData['organization_id']),
                'organization_name': util.replaceDefaultString(rowData['organization_name']),
                'update_sequence_id': util.replaceDefaultNumber(rowData['update_sequence_id']),
                'log_state': util.replaceDefaultNumber(rowData['log_state']),
                'log_active': util.replaceDefaultNumber(rowData['log_active']),
                'log_datetime': util.replaceDefaultDatetime(rowData['log_datetime']),
                'log_asset_first_name': util.replaceDefaultString(rowData['log_asset_first_name']),
                'log_asset_last_name': util.replaceDefaultString(rowData['log_asset_last_name']),
                'log_asset_id': util.replaceDefaultNumber(rowData['log_asset_id']),
                'asset_id': util.replaceDefaultNumber(rowData['asset_id']),
                'asset_type_category_id': util.replaceDefaultNumber(rowData['asset_type_category_id'])
            };
            responseData.push(rowDataArr);
        }, this);
        callback(false, responseData);

    };

    var formatActivityStatusList = function (data, callback) {
        var responseData = new Array();
        if (Object.prototype.toString.call(data[0]) === '[object Array]' || Object.prototype.toString.call(data[0]) === '[object Object]') {
            data.forEach(function (rowData, index) {
                var rowDataArr = {
                    "activity_status_id": util.replaceDefaultNumber(rowData['activity_status_id']),
                    "activity_status_name": util.replaceDefaultString(rowData['activity_status_name']),
                    "activity_status_type_id": util.replaceDefaultNumber(rowData['activity_status_type_id']),
                    "activity_status_type_name": util.replaceDefaultString(rowData['activity_status_type_name']),
                    "activity_status_type_category_id": util.replaceDefaultNumber(rowData['activity_status_type_category_id']),
                    "activity_status_type_category_name": util.replaceDefaultString(rowData['activity_status_type_category_name']),
                    "activity_type_id": util.replaceDefaultNumber(rowData['activity_type_id']),
                    "activity_type_name": util.replaceDefaultString(rowData['activity_type_name']),
                    "activity_type_category_id": util.replaceDefaultNumber(rowData['activity_type_category_id']),
                    "activity_type_category_name": util.replaceDefaultString(rowData['activity_type_category_name']),
                    "workforce_id": util.replaceDefaultNumber(rowData['workforce_id']),
                    "workforce_name": util.replaceDefaultString(rowData['workforce_name']),
                    "account_id": util.replaceDefaultNumber(rowData['account_id']),
                    "account_name": util.replaceDefaultString(rowData['account_name']),
                    "organization_id": util.replaceDefaultNumber(rowData['organization_id']),
                    "organization_name": util.replaceDefaultString(rowData['organization_name']),
                    "update_sequence_id": util.replaceDefaultNumber(rowData['update_sequence_id']),
                    "log_asset_id": util.replaceDefaultNumber(rowData['log_asset_id']),
                    'log_asset_first_name': util.replaceDefaultString(rowData['log_asset_first_name']),
                    'log_asset_last_name': util.replaceDefaultString(rowData['log_asset_last_name']),
                    "log_datetime": util.replaceDefaultDatetime(rowData['log_datetime']),
                    "log_state": util.replaceDefaultNumber(rowData['log_state']),
                    "log_active": util.replaceDefaultNumber(rowData['log_active'])

                };
                responseData.push(rowDataArr);
            }, this);
        }
        callback(false, responseData);
    };
    
    this.workForceActivityTypeInsert = function (request) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                    request.activity_type_name,
                    request.activity_type_description,
                    request.activity_type_category_id,
                    request.access_level_id,
                    request.workforce_id,
                    request.account_id,
                    request.organization_id,
                    request.asset_id,
                    request.datetime_log
                );
            var queryString = util.getQueryString('ds_p1_1_workforce_activity_type_mapping_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                	if(err === false){
                		request['activity_type_id'] = data[0].activity_type_id;
                		request['update_type_id'] = 0;
                		workForceActivityTypeHistoryInsert(request).then(()=>{});
                		resolve(data);
                	}else{
                		reject(err);
                	}
                });
            }
        });
    }
    
   this.workForceActivityTypeUpdate =  function(request) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    request.activity_type_id,
                    request.activity_type_name,
                    request.activity_type_description,
                    request.access_level_id, 
                    request.asset_id,
                    request.datetime_log
                );
            var queryString = util.getQueryString('ds_p1_1_workforce_activity_type_mapping_update', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                	if(err === false){                		
                		request['update_type_id'] = 901;
                		workForceActivityTypeHistoryInsert(request).then(()=>{});
                		resolve(data);
                	}else{
                		reject(err);
                	}
                });
            }
        });
    }
    
    this.workForceActivityTypeDelete = function (request) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                    request.organization_id,
                    request.account_id,
                    request.workforce_id,
                    request.activity_type_id,
                    request.asset_id,
                    request.datetime_log
                );
            var queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_delete', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                	if(err === false){                		
                		request['update_type_id'] = 902;
                		workForceActivityTypeHistoryInsert(request).then(()=>{});
                		resolve(data);
                	}else{
                		reject(err);
                	}
                });
            }
        });
    }
    
    function workForceActivityTypeHistoryInsert(request) {
        return new Promise((resolve, reject)=>{
            var paramsArr = new Array(
                request.activity_type_id,
                request.organization_id,
                request.update_type_id,
                request.datetime_log
                );
            var queryString = util.getQueryString('ds_p1_workforce_activity_type_mapping_history_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    }
    
    this.getAccessLevelActivityTypeList = function (request) {
		return new Promise((resolve, reject)=>{
	        var paramsArr = new Array(
	        		request.access_level_id,
	        		request.organization_id,
	        		request.account_id,
	        		request.workforce_id,
	        		request.activity_type_category_id,
	        		request.page_start,
	        		util.replaceQueryLimit(request.page_limit)
	                );
	
	        var queryString = util.getQueryString('ds_p1_1_workforce_activity_type_mapping_select', paramsArr);
	        if (queryString != '') {
	            db.executeQuery(1, queryString, request, function (err, data) {
	            	//console.log("err "+err);
	               if(err === false) {
	               		console.log('data: '+data.length);
	               		resolve(data);        				        			      			  
	                } else {
	                   reject(err);
	               }
	            });
	   		}
		});
    };
    
    this.getEntityActivityStatusList = function (request) {
		return new Promise((resolve, reject)=>{
        var paramsArr = new Array(
        		request.organization_id,
        		request.account_id,
        		request.workforce_id,
        		request.activity_type_category_id,
        		request.activity_type_id,
        		request.flag,
        		request.datetime_log,
        		request.page_start,
        		util.replaceQueryLimit(request.page_limit)
                );

        var queryString = util.getQueryString('ds_p1_1_workforce_activity_status_mapping_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, function (err, data) {
            	//console.log("err "+err);
               if(err === false) {
               		console.log('data: '+data.length);
               		resolve(data);        				        			      			  
                } else {
                   reject(err);
               }
            });
   		}
		});
    };
    
    this.getCommunicationList = function (request) {    	
		return new Promise((resolve, reject)=>{
	        var paramsArr = new Array(
	        		request.flag,
	        		request.communication_id,
	        		request.communication_type_id,
	        		request.communication_type_category_id,
	        		request.activity_type_id,
	        		request.workforce_id,
	        		request.account_id,
	        		request.organization_id,
	        		request.page_start,
	        		util.replaceQueryLimit(request.page_limit)
	                );
	
	        var queryString = util.getQueryString('ds_p1_communication_list_select', paramsArr);
	        if (queryString != '') {
	            db.executeQuery(1, queryString, request, function (err, data) {
	            	//console.log("err "+err);
	               if(err === false) {
	               		console.log('data: '+data.length);
	               		resolve(data);        				        			      			  
	                } else {
	                   reject(err);
	               }
	            });
	   		}
		});
    };
};
module.exports = ActivityConfigService;
