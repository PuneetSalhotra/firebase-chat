/*
 * author: A Sri Sai Venkatesh
 */
var uuid = require('uuid');
const TimeUuid = require('cassandra-driver').types.TimeUuid;

function EncTokenInterceptor(app, cacheWrapper, responseWrapper, util) {

    app.use(function (req, res, next) {
        cacheWrapper.getServiceId(req.url, function (err, result) {

            if (err) {
                //console.log('Unable to get the service Id')
                global.logger.write('debug', 'Unable to get the service Id', {}, req.body);
                req.body.service_id = 0;
            } else {
                console.log('Service Id: ' + result)
                // global.logger.write('debug', 'Service Id : ' + JSON.stringify(result), {}, req.body);
                req.body.service_id = result;
                var bundleTransactionId = TimeUuid.now();
                req.body.bundle_transaction_id = bundleTransactionId;
                req.body.url = req.url;
                if (req.body.url.includes('/' + global.config.version + '/account/')) {
                    req.body['module'] = 'asset';
                    global.logger.write('request', JSON.stringify(req.body, null, 2), req.body, req.body);
                    global.logger.write('info', 'bypassing enc token checking as request is from account', {}, req.body);
                    next();
                } else if (req.body.url.includes('/' + global.config.version + '/zoho/')) {
                    global.logger.write('request', JSON.stringify(req.body, null, 2), req.body, req.body);
                    global.logger.write('info', 'bypassing enc token checking as request is for zoho services', {}, req.body);
                    next();
                } else {

                    switch (req.url) {

                        case '/' + global.config.version + '/asset/passcode/alter':
                        case '/' + global.config.version + '/asset/passcode/alter/v1':
                            //case '/' + global.config.version + '/sms-dlvry/sinfini':
                            //case '/' + global.config.version + '/sms-dlvry/nexmo':
                            //case '/' + global.config.version + '/sms-dlvry/twilio':
                            req.body['module'] = 'device';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), req.body, req.body);
                            next();
                            break;
                        case '/' + global.config.version + '/asset/passcode/check':
                            req.body['module'] = 'device';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), req.body, req.body);
                            next();
                            break;
                        case '/' + global.config.version + '/asset/link/set':
                            req.body['module'] = 'asset';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), req.body, req.body);
                            next();
                            break;
                        case '/' + global.config.version + '/asset/phonenumber/access/organization/list':
                            req.body['module'] = 'asset';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), req.body, req.body);
                            next();
                            break;
                        case '/' + global.config.version + '/pam/asset/cover/alter/clockin':
                            req.body['module'] = 'asset';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), req.body, req.body);
                            next();
                            break;
                        case '/' + global.config.version + '/asset/status/collection':
                            req.body['module'] = 'asset';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), req.body, req.body);
                            next();
                            break;
                        case '/' + global.config.version + '/send/email':
                        case '/' + global.config.version + '/wf/send/email':
                        case '/' + global.config.version + '/wf/send/sms':
                            req.body['module'] = 'asset';
                            // global.logger.write('request', JSON.stringify(req.body, null, 2), req.body, req.body);
                            next();
                            break;

                            // Stats cases
                        case '/' + global.config.version + '/stats/signup/count':
                        case '/' + global.config.version + '/stats/signup/list':
                        case '/' + global.config.version + '/stats/timeline/list':
                            req.body['module'] = 'asset';
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

                            if (req.body.hasOwnProperty("activity_id")) {
                                req.body['module'] = 'activity';

                            } else if (req.body.url.includes('activity')) {
                                req.body['module'] = 'activity';

                            } else {
                                req.body['module'] = 'asset';
                                
                            }
                            //console.log('Module : ' + req.body['module']);
                            global.logger.write('debug', 'Module : ' + req.body['module'], {}, req.body);

                            var asset_id = req.body.auth_asset_id || req.body.asset_id;

                            
                            cacheWrapper.getTokenAuth(asset_id, function (err, encToken) {
                                if (err) {                               
                                    global.logger.write('appError', 'Redis token Checking error : ' + JSON.stringify(err), err, req.body);
                                    res.send(responseWrapper.getResponse(null, {}, -7998, req.body));
                                    return;
                                } else {                                    
                                    global.logger.write('debug', encToken, {}, req.body);
                                    if (encToken === req.body.asset_token_auth) {                                        
                                        global.logger.write('debug', 'successfully redis encToken checking is done', {}, req.body);
                                        next();
                                    } else {                                        
                                        global.logger.write('debug', 'req.url : ' + req.url, {}, req.body);
                                        global.logger.write('serverError', 'Redis encToken checking failed : ' + JSON.stringify(err), {}, req.body);
                                        res.send(responseWrapper.getResponse(null, {}, -3204, req.body));
                                        return;
                                    }
                                }

                            });

                            break;
                    } //switch
                } //else
            } //else
        }) //getServiceId
    }) //app.use
}; // main function

module.exports = EncTokenInterceptor;
