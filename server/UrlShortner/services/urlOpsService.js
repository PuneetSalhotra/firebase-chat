const UrlListingService = require("./urlListingService");
const logger = require('../../logger/winstonLogger');
const fs = require('fs');

function UrlOpsService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    // const activityCommonService = objectCollection.activityCommonService;
    // const urlListingService = new UrlListingService(objectCollection);
    // const nodeUtil = require('util');
    const self = this;
    const uuidv4 = require('uuid/v4');

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.urlParametersShorten = async function (request) {

        if(request.url_mail_receivers && request.url_mail_receivers.length) {

            let errOne, urlData;
            for(let row of request.url_mail_receivers) {
                [errOne, urlData] = await urlLookupTransactionInsert({
                    ...request,
                    url_mail_receiver : row,
                    url_uuid: uuidv4()
                });
            }

            if (errOne) {
                return [errOne, {message: "Error shortening the URL parameters"}] 
            }
    
            return [false, urlData];
        }

        const [errOne, urlData] = await urlLookupTransactionInsert({
            ...request,
            url_uuid: uuidv4()
        });
        if (errOne) {
            return [errOne, {message: "Error shortening the URL parameters"}] 
        }

        return [false, urlData];
    }

    // Workforce Asset Type Mapping Update
    async function urlLookupTransactionInsert(request, workforceID, organizationID, accountID) {
        // IN p_url_uuid VARCHAR(100), IN p_url_form_data JSON, IN p_url_mail_receiver VARCHAR(100), 
        // IN p_organization_id BIGINT(20), IN p_log_datetime DATETIME
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.url_uuid,
            request.url_form_data,
            request.url_mail_receiver,
            request.organization_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_v1_url_lookup_transaction_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.urlParametersShortenV2 = async function (request) {
        let err = true;
        url_datetime_expiry = 72;
        let uuid = "";
        
        const url_form_data = typeof request.url_form_data === "string" ? JSON.parse(request.url_form_data):request.url_form_data; 
        //get previous entries on activity_id if there are any
        
        
        let [selectErr,selectData] = await getDetailsByActivity(url_form_data);
        if (selectErr) {
            return [selectErr, {message: "Error shortening the URL parameters"}] 
        }
        if(selectData.length>0){
        uuid =selectData[0].url_envelop_uuid;
         
        }
        else{
            uuid = uuidv4()
        }
     
        //Get expiry time
        let [expiryErr,expiryTime] = await getExpiryTime(url_form_data);
        // console.log("expiry time",expiryTime)
        if (expiryErr) {
            return [expiryErr, {message: "Error shortening the URL parameters"}] 
        }
        
        url_datetime_expiry  = expiryTime[0].ds_p1_organization_list_select?expiryTime[0].ds_p1_organization_list_select :72;
        
       let paramsArr = [
        url_form_data.activity_id,
        uuid,
        request.url_uuid,
        JSON.stringify(url_form_data),
        request.url_mail_sender,
        request.url_mail_receiver,
        request.url_datetime_sent,
        url_datetime_expiry||72,
        util.getCurrentUTCTime()
      ]
      const queryString = util.getQueryString('ds_v1_activity_url_lookup_transaction_insert', paramsArr);
      if (queryString !== '') {
          await db.executeQueryPromise(0, queryString, request)
            .then((data) => {        
                err = false;
            })
            .catch((err1) => {
                err = err1;
            })
      }


        return [err, []];
    }

    async function getDetailsByActivity(request) {
        let error=true;
        let responseData = []
        const paramsArr = [
            request.activity_id
        ]
        const queryString = util.getQueryString('ds_v1_activity_url_lookup_transaction_select_activity', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
              .then((data) => {
                  responseData = data;
                  error = false;
              })
              .catch((err) => {
                  error = err;
              })
        }
        return [error,responseData]
    }
    async function getExpiryTime(request) {
        let error=true;
        let responseData = []
        const paramsArr = [
            request.organization_id
        //    request.url_id,
        //    request.flag||0,
        //    util.getCurrentUTCTime()
        ]
        const queryString = util.getQueryString('ds_p1_organization_list_select', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
              .then((data) => {
                  responseData = data;
                  error = false;
              })
              .catch((err) => {
                  error = err;
              })
        }
        return [error,responseData]
    }

}

module.exports = UrlOpsService;