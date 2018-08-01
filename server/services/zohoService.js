/*
 * author: Nani Kalyan V
 */
var makeRequest = require('request');
var https = require('https');

function ZohoService(objectCollection) {

    var db = objectCollection.db;
    var util = objectCollection.util;
    var activityCommonService = objectCollection.activityCommonService;
    
    var domain_url = "subscriptions.zoho.com";
    var authorization = "Zoho-authtoken f848c203c5a0678e514c950289a6b089";
    var orgId = "668219491"; 
    
    //Create a Customer
    this.createCustomer = function(request, callback) {
        var url = 'https://' + domain_url + "/api/v1/customers";
                   
        //console.log('Request Params: ', request);
        var options = {
            method: 'POST',
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
          };
 
        makeRequest(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, info, response.statusCode);
          }
        });
        
    };
    
    //Get Customer Details
    this.getCustomerDetails = function(request, callback) {
        var url = 'https://' + domain_url + "/api/v1/customers/" + request.customer_id;
                   
        var options = {
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization
            }
          };
 
        makeRequest.get(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            //console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, {}, response.statusCode);
          }
        });
        
    };
    
    //Update Customer Details
    this.updateCustomerDetails = function(request, callback) {
        var url = 'https://' + domain_url + "/api/v1/customers/" + request.customer_id;
        
        console.log('URL: ', url);
        console.log('Request Params : ', request);
                   
        var options = {
            method: 'PUT',
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
          };
       
        makeRequest(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, info, response.statusCode);
          }
        });
    };
    
    //Delete a Customer
    this.deleteCustomer = function(request, callback) {
        var url = 'https://' + domain_url + "/api/v1/customers/"+request.customer_id;
                   
        var options = {
            method: 'DELETE',
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization
            }
          };
 
        makeRequest(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            //console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, {}, response.statusCode);
          }
        });
        
    };
    
    //Mark Customer as Active
    this.markCustomerActive = function(request, callback) {
        var url = 'https://' + domain_url + "/api/v1/customers/"+request.customer_id+'/markasactive';
                           
        var options = {
            method: 'POST',
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization,
              "Content-Type": "application/json"
            }
          };
 
        makeRequest(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            //console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, {}, response.statusCode);
          }
        });
    };
    
    
    //Mark Customer as InActive
    this.markCustomerInActive = function(request, callback) {
        var url = 'https://' + domain_url + "/api/v1/customers/" + request.customer_id + "/markasinactive";     
                   
        var options = {
            method: 'POST',
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization,
              "Content-Type": "application/json"
            }
          };
 
        makeRequest(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            //console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, info, response.statusCode);
          }
        });
    };
    
    //Create new Customer Subscription
    this.createCustomerSubscription = function(request, callback) {
        var url = 'https://' + domain_url + "/api/v1/subscriptions";
                           
        var options = {
            method: 'POST',
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
          };
 
        makeRequest(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            //console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, info, response.statusCode);
          }
        });
        
    };
    
    //Create subscription for an existing customer
    this.createExistingCustomerSubscription = function(request, callback) {
        var url = 'https://' + domain_url + "/api/v1/subscriptions";
        
        var options = {
            method: 'POST',
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
          };
 
        makeRequest(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            //console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, info, response.statusCode);
          }
        });
    };
    
    //Update customer subscription
    this.updateCustomerSubscription = function(request, callback) {
        var url = 'https://' + domain_url + "/api/v1/subscriptions/" + request.subscription_id;
        
        var options = {
            method: 'PUT',
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
          };
 
        makeRequest(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            //console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, info, response.statusCode);
          }
        });
        
    };
    
    //Delete customer subscription
    this.deleteCustomerSubscription = function(request, callback) {
        var url = 'https://' + domain_url + "/api/v1/subscriptions/"+request.subscription_id;
        
        var options = {
            method: 'DELETE',
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization,
              "Content-Type": "application/json"
            }            
          };
 
        makeRequest(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            //console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, info, response.statusCode);
          }
        });
        

    };
    
    //Get Customer card details
    this.getCustomerCardDetails = function(request, callback) {
        var url = 'https://' + domain_url + "/api/v1/customers/"+request.customer_id+"/cards/"+request.card_id;
        
        console.log('Request Params : ' , request);
        var options = {            
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization,              
            }            
          };
 
        makeRequest(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            //console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, info, response.statusCode);
          }
        });
        
  
    };
    
    //Update customer card details
    this.updateCustomerCardDetails = function(request, callback) {
        var url = 'https://' + domain_url + "/api/v1/customers/"+request.customer_id+"/cards/"+request.card_id;
        
        console.log('URL : ', url);
        console.log('Request Params : ', request);
        
        var options = {
            method: 'PUT',
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
          };
 
        makeRequest(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            //console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, info, response.statusCode);
          }
        });

    };
    
    //Delete customer card details
    this.deleteCustomerCardDetails = function(request, callback) {
      var url = 'https://' + domain_url + "/api/v1/customers/"+request.customer_id+"/cards/"+request.card_id;
      
      var options = {
            method: 'DELETE',
            url: url,
            headers: {
              "X-com-zoho-subscriptions-organizationid": orgId,
              "Authorization": authorization,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
          };
 
        makeRequest(options, (error, response, body)=>{
          if(error) {
              console.log('error : ' + error);
              callback(true, error, -1999);
          }
          else  {
            var info = JSON.parse(body);
            //console.log(info);
            (response.statusCode == 200) ? callback(false, info, 200) : callback(false, info, response.statusCode);
          }
        });
  
    };
    
    this.updateAcctBillingDetails = function(request, callback) {
        var logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;
        
        var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.account_billing_product_id,
                request.account_billing_plan_id,
                request.account_billing_customer_id,
                request.account_billing_customer_email,
                request.account_billing_customer_billing_address,
                request.account_billing_customer_currency,
                request.account_billing_subscription_id,
                request.account_billing_subscription_status,
                request.account_billing_subscription_date,
                request.account_billing_payment_status,
                request.account_billing_payment_gateway,
                request.account_billing_payment_due_date,
                request.account_billing_trail_end_date,
                request.datetime_log,
                request.asset_id
                );
        var queryString = util.getQueryString('ds_p1_account_list_update_billing_details', paramsArr);
        if (queryString != '') {
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err === false) {
                    accountListHistoryInsert(request, 1007).then(()=>{});
                    callback(false, {}, 200);
                } else {
                    callback(true, err, -9999);
                }
            });
        }
    };
    
    this.updateAssetBillingDetails = function(request, callback) {
        var logDatetime = util.getCurrentUTCTime();        
        request['datetime_log'] = logDatetime;
        
            var paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.billing_asset_id,
                request.datetime_log,
                request.asset_id
                );
            var queryString = util.getQueryString('ds_p1_account_list_update_billing_asset', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    if (err === false) {
                        accountListHistoryInsert(request, 1008).then(()=>{});
                        callback(false, {}, 200);
                    } else {
                        callback(true, err, -9999);
                    }
                });
            }        
    };
    
    function accountListHistoryInsert(request, updateTypeId) {
        return new Promise((resolve, reject)=>{
           var paramsArr = new Array(
                request.account_id,
                request.organization_id,
                updateTypeId,
                request.datetime_log
                );
            var queryString = util.getQueryString('ds_p1_account_list_history_insert', paramsArr);
            if (queryString != '') {
                db.executeQuery(0, queryString, request, function (err, data) {
                    (err === false) ? resolve() : reject(err);                                    
                });
            }
        });
    };
    
}
;

module.exports = ZohoService;
