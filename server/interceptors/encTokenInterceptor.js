/*
 * author: A Sri Sai Venkatesh
 */
var uuid = require('uuid');

function EncTokenInterceptor(app, cacheWrapper, responseWrapper, util) {

    app.use(function (req, res, next) {
        cacheWrapper.getServiceId(req.url, function (err, result) {

            if (err) {
                console.log('Unable to get the service Id')
                req.body.service_id = 0;
            } else {
                console.log('Service Id : ' + result)
                req.body.service_id = result;
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
                        global.logger.write('request', '', req.body, req.body);
                        next();
                        break;
                    case '/0.1/asset/passcode/check':
                        req.body['module'] = 'device';
                        global.logger.write('request', '', req.body, req.body);
                        next();
                        break;
                    case '/0.1/asset/link/set':
                        req.body['module'] = 'asset';
                        global.logger.write('request', '', req.body, req.body);
                        next();
                        break;
                    case '/0.1/pam/asset/cover/alter/clockin':
                        req.body['module'] = 'asset';
                        global.logger.write('request', '', req.body, req.body);
                        next();
                        break;
                    case '/0.1/send/email':
                        //req.body['module'] = 'asset';
                        //global.logger.write('request', '', req.body, req.body);
                        next();
                        break;
                    default:
                        if (req.body.hasOwnProperty("activity_id")) {
                            req.body['module'] = 'activity';
                        } else {
                            if (req.body.url.includes('activity')) {
                                req.body['module'] = 'activity';
                            } else {
                                req.body['module'] = 'asset';
                            }
                        }
                        
                        //Bharat Requirement
                        if(req.body.url.includes('/' + global.config.version + '/send/email?')){
                            console.log('Inside If');
                            next();
                            return;
                        }
                            
                        console.log('Module : ' + req.body['module']);
                        cacheWrapper.getTokenAuth(req.body.asset_id, function (err, encToken) {
                            if (err) {
                                console.log("redis token Checking error:");
                                global.logger.write('appError', 'Redis token Checking error', err, req.body);
                                res.send(responseWrapper.getResponse(null, {}, -7998, req.body));
                                return;
                            } else {
                                console.log(encToken);
                                if (encToken === req.body.asset_token_auth) {
                                    console.log("successfully redis encToken checking is done");
                                    global.logger.write('debug', 'successfully redis encToken checking is done', {},req.body);
                                    next();
                                } else {
                                    console.log('redis encToken checking failed : ' + err);
                                    global.logger.write('serverError', 'Redis encToken checking failed', {}, req.body);
                                    res.send(responseWrapper.getResponse(null, {}, -3204, req.body));
                                    return;
                                }
                            }

                        });

                        break;
                } //switch
            } //else
        }) //getServiceId
    }) //app.use
} // main function
;
module.exports = EncTokenInterceptor;
