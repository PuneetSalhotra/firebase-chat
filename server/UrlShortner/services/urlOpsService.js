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

}

module.exports = UrlOpsService;