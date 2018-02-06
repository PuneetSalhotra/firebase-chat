/*
 *author: Sri Sai Venkatesh 
 * 
 */
var AwsSss = require('../utils/s3Wrapper');

function UtilityController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;
    var util = objCollection.util;
    var sss = new AwsSss();
    
    app.post('/' + global.config.version + '/time/access/global/entry/collection', function (req, res) {

        var statusCode = 200;
        res.send(responseWrapper.getResponse(false, {}, statusCode,req.body));

    });
    
    //Bharat Requirement
    app.post('/' + global.config.version + '/send/email', function (req, res) {
        var otp = util.randomInt(1111,9999);
        otp = otp.toString();
        console.log('In Post method');
        util.sendEmail('bharat@desker.co',otp,JSON.stringify(req.body),'',function (err, data) {
        if (err === false) {
          res.send(responseWrapper.getResponse(err, data.response, 200, req.body));          
        } else {
          res.send(responseWrapper.getResponse(err, data.code, 200, req.body));
        }
        });
    });
    
    //Bharat Requirement
    app.get('/' + global.config.version + '/send/email', function (req, res) {
        var otp = util.randomInt(1111,9999);
        otp = otp.toString();
        console.log('In GET method');
        util.sendEmail('bharat@desker.co',otp,JSON.stringify(req.query),'',function (err, data) {
        if (err === false) {
          res.send(responseWrapper.getResponse(err, data.response, 200, req.body));          
        } else {
          res.send(responseWrapper.getResponse(err, data.code, 200, req.body));
        }
        });
    });
    
    //VNK webhook
    app.get('/' + global.config.version + '/vnk', function (req, res) {
        console.log('Request : ', req.body);
        res.send(responseWrapper.getResponse('', {}, 200, req.body));        
    });
    
     app.post('/' + global.config.version + '/asset/bucket/add', function (req, res) {
        sss.createAssetBucket(req.body,function (err, data, statusCode) {
        if (err === false) {
          res.send(responseWrapper.getResponse(err, data, statusCode, req.body));          
        } else {
          res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
        }
        });
    });
        
}
module.exports = UtilityController;