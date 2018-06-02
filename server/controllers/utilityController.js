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
    app.post('/' + global.config.version + '/vnk', function (req, res) {
        console.log('Request : ', req.body);
        req.body.country_code = '91';
        req.body.to_phone_number = '9966626954';
        req.body.from_phone_number = '+15107094638';
        
        util.twilioMakeCall(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
    });
    
    //VNK webhook
    app.get('/' + global.config.version + '/vnk', function (req, res) {
        console.log('Request : ', req.body);
        req.body.country_code = '91';
        req.body.to_phone_number = '9966626954';
        req.body.from_phone_number = '+15107094638';
        
        util.twilioMakeCall(req.body, function (err, data, statusCode) {
            if (err === false) {
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            } else {
                data = {};
                res.send(responseWrapper.getResponse(err, data, statusCode, req.body));
            }
        });
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
    
    //Send SMS Invite
    app.post('/' + global.config.version + '/invite/send/sms', function (req, res) {
        var request = req.body;
        console.log('Request params : ', request);
        var text = "Hey "+ request.receiver_name +" , "+request.sender_name+" has invited you to join the "+request.organization_name+" workforce as a coworker. ";
            text += "Download the Desker App from the app store and use your mobile number to sign in into our new organisation.";
        
        console.log("sms Text : " + text);
        
        util.sendSmsMvaayoo(text, request.country_code, request.phone_number, function(err,res){
                console.log(err,'\n',res);                 
            });
            
        res.send(responseWrapper.getResponse(false, {}, 200, req.body));
     });
        
}
module.exports = UtilityController;