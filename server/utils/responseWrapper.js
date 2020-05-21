const logger = require('../logger/winstonLogger');

function ResponseWrapper(util) {

    this.getResponse = function (err, data, statusCode, request) {
        var response = {
            status: statusCode,
            service_id: request.bundle_transaction_id || 0,
            //description: responseCollection[statusCode],
            gmt_time: util.getCurrentUTCTime(),
            response: data
        };

        if (
            request.url === `/${global.config.version}/asset/passcode/check` ||
            request.url === `/${global.config.version}/asset/passcode/alter/v1`
        ) {
            console.log("responseWrapper: ", request.url);
            response.asset_phone_country_code = request.asset_phone_country_code;
            response.asset_phone_number = request.asset_phone_number;
        }

        try {
            global.logger.write('response', 'response', response, request);
            logger.info(`service_id ${request.bundle_transaction_id || 0}`, { type: 'server_response', request_body: request, response });
        } catch (e) { }

        return response;
    };

}
;
/*
 var responseCollection = {
 // will define all response status codes here, so they will have corresponding status codes
 200: "success",
 201: "success",
 "-9999": "some internal error"
 };
 */
module.exports = ResponseWrapper;
