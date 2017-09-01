/* 
 * author: A Sri Sai Venkatesh
 */
var uuid = require('uuid');

function EncTokenInterceptor(app, cacheWrapper, responseWrapper, util) {

    app.use(function (req, res, next) {
        console.log("request url is: "+req.url);
        //cassandraWrapper.addBundleTransaction(req.body,req.url, function (err, bundleTransactionId) {
        //if (err === false) {
        var bundleTransactionId = uuid.v1();
        req.body.bundle_transaction_id = bundleTransactionId;
        req.body.url = req.url;
        switch (req.url) {
            /*
             case '/time/value':
             global.logger.write('', req.body, 'device', 'request');
             next();
             break;
             */
            case '/0.1/asset/passcode/alter':
                req.body['module'] = 'device';
                //global.logger.write('', req.body, 'request');
                next();
                break;
            case '/0.1/asset/passcode/check':
                req.body['module'] = 'device';
                //global.logger.write('', req.body, 'request');
                next();
                break;
            case '/0.1/asset/link/set':
                req.body['module'] = 'asset';
                //global.logger.write('', req.body, 'request');
                next();
                break;
            default:
                //global.logger.write('', req.body, 'request');
                //console.log("came to default");
                cacheWrapper.getTokenAuth(req.body.asset_id, function (err, encToken) {
                    if (err) {
                        console.log("redis token Checking error:");
                        //console.log("logging error: " + err);
                        res.send(responseWrapper.getResponse(null, {}, -7998));
                        return;
                    } else {
                        //console.log(encToken);
                        if (encToken === req.body.asset_token_auth) {
                            console.log("successfully redis encToken checking is done");
                            next();
                        } else {
                            console.log('redis encToken cecking failed');
                            //console.log(encToken + 'is enc token we got from redis');
                            res.send(responseWrapper.getResponse(null, {}, -3204));
                        }
                    }

                });

                break;
        }


        return;

        //} else {
        //console.log("cassandra query insert error");
        //res.send(responseWrapper.getResponse(err, {}, -8998));// cassandra query error
        //return;
        //}
        //});



    });




}
;
module.exports = EncTokenInterceptor;
