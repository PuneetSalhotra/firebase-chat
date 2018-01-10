/*
 *author: Nani Kalyan V
 * 
 */

var CassandraWrapper = require('../utils/cassandraWrapper');
var cassandraWrapper = new CassandraWrapper();

function LogService(objectCollection) {

    //var db = objectCollection.db;
    //var cacheWrapper = objectCollection.cacheWrapper;
    //var activityCommonService = objectCollection.activityCommonService;
    //var util = objectCollection.util;
    //var forEachAsync = objectCollection.forEachAsync;
    //var activityPushService = objectCollection.activityPushService;
    
    this.getTransactionsByDevice = function (request, callback) {
        
        var deviceCtyCode;
        var devicePhoneNumber;
        var date;
        var serviceId;
        var query;
        
        query = "SELECT devcntrycd, devphnnmbr, date, srvcid, bndlid, recid,actvtyid,actvtyttle,asstid,asstname,crtd, \n\
                    lvlid,lvlnm,msg,req,reqtime,res,rescode,ressts,restat,restime,srcid,srcnm,srvcname,stktrc,url FROM transactionsbydevice";
        
                if(request.clause == 1) {
                    deviceCtyCode =  "'"+ request.device_country_code + "'";
                    devicePhoneNumber = "'"+ request.device_phone_number + "'";
                    date = request.date;
                    //serviceId = util.replaceDefaultNumber(request.service_id);
                    serviceId = request.service_id || -1;
                    query += " WHERE devCntryCd = " +  deviceCtyCode + 
                             " AND devPhnNmbr = " +  devicePhoneNumber + 
                             " AND date = " + "'"+ date + "'" +
                             " AND srvcID = " +  serviceId;
                 }
                     
                 if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
                 query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('log',query, callback);        
    };

    this.getTransactionsByActivity = function (request, callback) {
        
        var activityId;
        var date;
        var serviceId;
        
       var query = "SELECT actvtyid, date, srvcid, bndlid, recId, actvtyttle, asstid, asstnm, toDate(crtd), devCntryCd, \n\
                    devPhnNmbr, lvlId, lvlnm, msg, req, toDate(reqtime), res, rescode,res,ressts,restat,\n\
                    toDate(restime), srcid, srcnm, srvcname, stktrc, url FROM transactionsbyactivity";
                        
        if(request.clause == 1) { 
                activityId = request.activity_id || 0;
                date = request.date || "''";
                serviceId = request.service_id || -1;
                
                query += " WHERE actvtyid = " +  activityId + 
                          " AND date = " + "'"+ date + "'" +
                          " AND srvcID = " +  serviceId;
        }
        
        if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
        query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('log',query, callback);
    };
    
    this.getTransactionsByAsset = function (request, callback) {
        
        var assetId;
        var date;
        var serviceId;
        
        var query = "SELECT actvtyid, date, srvcid, bndlid, recId, actvtyttle, asstid, asstnm, toDate(crtd), devCntryCd, \n\
                    devPhnNmbr, lvlId, lvlnm, msg, req, toDate(reqtime), res, rescode,res,ressts,restat,\n\
                    toDate(restime), srcid, srcnm, srvcname, stktrc, url FROM transactionsbyasset";
                   
        if(request.clause == 1) { 
                assetId = request.search_asset_id || 0;
                date = request.date || "''";
                serviceId = request.service_id || -1;
                
                query += " WHERE asstid = " +  assetId + 
                          " AND date = " + "'"+ date + "'" +
                          " AND srvcID = " +  serviceId;
        }
        
        if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
        query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('log',query, callback);
    };
    
    this.getSessionByAsset = function (request, callback) {
        var assetId;
        var date;
                
        var query = "SELECT * FROM sessions_by_asset";
                   
        if(request.clause == 1) { 
                assetId = request.search_asset_id || 0;
                year = request.year || "''";
                        
                query += " WHERE astid = " +  assetId + 
                          " AND year = " + year;
               }
        
        if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
        query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('',query, callback);
    };
    
    this.getSessionByWorkforce = function (request, callback) {
        var workforceId;
        var devOs;
        var year;
                
        var query = "SELECT * FROM sessions_by_workforce";
                   
        if(request.clause == 1) { 
                workforceId = request.search_workforce_id || 0;
                devOs = "'" + request.device_os + "'" || '0';
                year = request.year || "''";
                        
                query += " WHERE wkfid = " +  workforceId + 
                          " AND devos = " + devOs + 
                          " AND year = " + year;
               }
        
        if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
        query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('',query, callback);
    };
    
    this.getSessionByAccount = function (request, callback) {
        var accountId;
        var devOs;
        var year;
                
        var query = "SELECT * FROM sessions_by_account";
                   
        if(request.clause == 1) { 
                accountId = request.search_account_id || 0;
                devOs = "'" + request.device_os + "'"  || 0;
                year = request.year || "''";
                        
                query += " WHERE accid = " +  accountId + 
                          " AND devos = " + devOs +
                          " AND year = " + year;
               }
        
        if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
        query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('',query, callback);
    };
    
    this.getSessionByOrganization = function (request, callback) {
        var organizationId;
        var devOs;
        var year;
                
        var query = "SELECT * FROM sessions_by_organization";
                   
        if(request.clause == 1) { 
                organizationId = request.search_organization_id || 0;
                devOs = "'" + request.device_os + "'"  || 0;
                year = request.year || "''";
                        
                query += " WHERE orgid = " +  organizationId + 
                          " AND devos = " + devOs +
                          " AND year = " + year;
               }
        
        if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
        query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('',query, callback);
    };
    
    this.getSessionByDeviceType = function (request, callback) {
        var deviceType;
        var month;
        var year;
                
        var query = "SELECT * FROM sessions_by_device_type";
                   
        if(request.clause == 1) { 
                deviceType = request.device_type || 0;
                month = "'" + request.month + "'"  || 0;
                year = request.year || "''";
                        
                query += " WHERE devtyp = " +  deviceType + 
                          " AND year = " + year +
                          " AND month = " + month;
               }
        
        if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
        query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('',query, callback);
    };
    
    this.getAssetLocation = function (request, callback) {
        var assetId;
        var year;
                
        var query = "SELECT * FROM location_by_asset";
                   
        if(request.clause == 1) { 
                assetId = request.search_asset_id  || 0;
                year = request.year || "''";
                        
                query += " WHERE astid = " +  assetId + 
                          " AND year = " + year;
                          
               }
        
        if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
        query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('',query, callback);
    }
    
    this.getAssetWorkhours = function (request, callback) {
        var assetId;
        var year;
                
        var query = "SELECT * FROM workhrs_by_asset";
                   
        if(request.clause == 1) { 
                assetId = request.search_asset_id  || 0;
                year = request.year || "''";
                        
                query += " WHERE astid = " +  assetId + 
                          " AND year = " + year;
                          
               }
        
        if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
        query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('',query, callback);
    };
    
    this.getWorkforceWorkhours = function (request, callback) {
        var workforceId;
        var year;
                
        var query = "SELECT * FROM workhrs_by_workforce";
                   
        if(request.clause == 1) { 
                workforceId = request.search_workforce_id || 0;
                year = request.year || "''";
                        
                query += " WHERE wkfid = " +  workforceId + 
                         " AND year = " + year;
               }
        
        if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
        query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('',query, callback);
    };
    
    this.getAccountWorkhours = function (request, callback) {
        var accountId;
        var year;
                
        var query = "SELECT * FROM workhrs_by_account";
                   
        if(request.clause == 1) { 
                accountId = request.search_account_id || 0;
                year = request.year || "''";
                        
                query += " WHERE accid = " +  accountId + 
                         " AND year = " + year;
               }
        
        if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
        query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('',query, callback);
    };
    
    this.getOrganizationWorkhours = function (request, callback) {
        var organizationId;
        var year;
                
        var query = "SELECT * FROM workhrs_by_organization";
                   
        if(request.clause == 1) { 
                organizationId = request.search_organization_id || 0;
                year = request.year || "''";
                        
                query += " WHERE orgid = " +  organizationId + 
                         " AND year = " + year;
               }
        
        if(request.hasOwnProperty('limit')) { query += " LIMIT " + request.limit; } 
        query += " ALLOW FILTERING;";
        
        //console.log(query)
        executeQuery('',query, callback);
    };
    
    
    var executeQuery = function(log, query, callback) {
        var messageCollection ={};
        messageCollection.environment = global.mode;
        (log === '') ?  messageCollection.log = 'session' : messageCollection.log = 'log';
        //console.log('MessageCollection: ', messageCollection)
        cassandraWrapper.executeQuery(messageCollection, query, function (err, data) {
            if (!err) {
                callback(false, data.rows, 200);
                return;
            } else {
                callback(true, false, -9998);
                return;
            }
        });
    } 
};

module.exports = LogService;