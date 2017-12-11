/*
 *author: Sri Sai Venkatesh 
 * 
 */


function UtilityController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var util = objCollection.util;

    app.post('/' + global.config.version + '/time/access/global/entry/collection', function (req, res) {

        var statusCode = 200;
        res.send(responseWrapper.getResponse(false, {}, statusCode,req.body));

    });
    
    app.post('/' + global.config.version + '/send/email', function (req, res) {
        var otp = util.randomInt(1111,9999);
        otp = otp.toString();
        util.sendEmail('bharat@desker.co',otp,JSON.stringify(req.body),'',function (err, data) {
        if (err === false) {
          res.send(responseWrapper.getResponse(err, data.response, 200, req.body));          
        } else {
          res.send(responseWrapper.getResponse(err, data.code, 200, req.body));
        }
        });
    });

}


module.exports = UtilityController;