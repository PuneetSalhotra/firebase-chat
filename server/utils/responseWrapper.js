
function ResponseWrapper(util) {


    this.getResponse = function (err, data, statusCode, request) {
        //console.log('req in response wrapper is \n' + request);
        var response = {
            status: statusCode,
            //description: responseCollection[statusCode],
            gmt_time: util.getCurrentUTCTime(),
            response: data
        };

        //global.logger.write((response), request, 'response');
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
    