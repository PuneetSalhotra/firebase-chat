/*
 * author: A Sri Sai Venkatesh
 */
//var uuid = require('uuid');
const TimeUuid = require('cassandra-driver').types.TimeUuid;

function EncTokenInterceptor(app, cacheWrapper, responseWrapper, util) {   
    
    async function checkThisService(req, res, next) {
        //let proceed = false;
        console.log('In checkThisService');
        let asset_id = req.body.auth_asset_id || req.body.asset_id;
        switch (req.url) {
            case '/' + global.config.version + '/activity/access/asset/list/v1': 
            case '/' + global.config.version + '/activity/access/asset/list/v3': 
            cacheWrapper.getTokenAuth(asset_id, function (err, encToken) {
                if (err) {                               
                    global.logger.write('appError', 'Redis token Checking error : ' + JSON.stringify(err), err, req.body);
                    res.json(responseWrapper.getResponse(null, {}, -7998, req.body));
                    return;
                } else {                                    
                    global.logger.write('conLog', 'got from cache layer : ' + encToken, {}, req.body);
                    global.logger.write('conLog', 'got from request body : ' + req.body.asset_token_auth, {}, req.body);
                    
                    if (req.body.asset_token_auth === 'undefined') {
                        global.logger.write('conLog', 'req.url : ' + req.url, {}, req.body);
                        global.logger.write('serverError', 'Redis encToken checking failed : ' + JSON.stringify(err), {}, {});
                        res.json(responseWrapper.getResponse(null, {}, -3204, req.body));
                        return;
                    } else if (encToken === req.body.asset_token_auth) {
                        global.logger.write('conLog', 'successfully redis encToken checking is done', {}, {});
                        //proceed = true;
                        next();
                    } else {
                        global.logger.write('conLog', 'req.url : ' + req.url, {}, req.body);
                        global.logger.write('serverError', 'Redis encToken checking failed : ' + JSON.stringify(err), {}, {});
                        res.json(responseWrapper.getResponse(null, {}, -3204, req.body));
                        return;
                    }
                }

            });
            break;
            
            default: next();
        }

        //return proceed;
    }

    app.use(async (req, res, next) => {
        //cacheWrapper.getServiceId(req.url, function (err, result) {

            //if (err) {
            //    //console.log('Unable to get the service Id')
            //    global.logger.write('conLog', 'Unable to get the service Id', {}, req.body);
            //    req.body.service_id = 0;
            //} else {                
                //global.logger.write('conLog', 'Service Id : ', JSON.stringify(result), {});
                //req.body.service_id = result;

                
                
                req.body.service_id = "";
                var bundleTransactionId = TimeUuid.now();
                req.body.bundle_transaction_id = bundleTransactionId;
                req.body.url = req.url;
                
                if(Number(req.headers['x-grene-auth-flag']) === 2) {
                    console.log('Skipping Redis Auth coz x-grene-auth-flag is 2');
                    
                    (req.body.hasOwnProperty('asset_token_auth')) ?
                        await checkThisService(req, res, next):
                        next();

                }else if(req.body.hasOwnProperty('access_token_verified') && Number(req.body.access_token_verified) === 1) {
                    console.log('Access token Verified');
                    
                    (req.body.hasOwnProperty('asset_token_auth')) ?
                        await checkThisService(req, res, next):
                        next();

                }
                else if(req.body.url.includes('/' + global.config.version + '/healthcheck')) {
                    next();
                    //res.end('Success');
                    //res.status(500).send('internal server error');
                } else if (req.body.url.includes('/' + global.config.version + '/account/')) {
                    req.body['module'] = 'asset';
                    global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                    global.logger.write('conLog', 'bypassing enc token checking as request is from account', {}, req.body);
                    next();
                } else if (req.body.url.includes('/' + global.config.version + '/docusign/webhook')) {
                    next();
                } else if (req.body.url.includes('/' + global.config.version + '/zoho/')) {
                    global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                    global.logger.write('conLog', 'bypassing enc token checking as request is for zoho services', {}, req.body);
                    next();
                } else {

                    switch (req.url) {
                        case '/' + global.config.version + '/asset/passcode/alter':
                        case '/' + global.config.version + '/asset/passcode/alter/v1':
                        case '/' + global.config.version + '/asset/passcode/alter/v2':
                            //case '/' + global.config.version + '/sms-dlvry/sinfini':
                            //case '/' + global.config.version + '/sms-dlvry/nexmo':
                            //case '/' + global.config.version + '/sms-dlvry/twilio':
                            req.body['module'] = 'device';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                            next();
                            break;
                        case '/' + global.config.version + '/asset/passcode/check':
                            req.body['module'] = 'device';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                            next();
                            break;
                        case '/' + global.config.version + '/asset/link/set':
                            req.body['module'] = 'asset';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                            next();
                            break;
                        case '/' + global.config.version + '/asset/phonenumber/access/organization/list':
                        case '/' + global.config.version + '/phone_number/verify/invite':                            
                            req.body['module'] = 'asset';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                            next();
                            break;
                        case '/' + global.config.version + '/pam/asset/cover/alter/clockin':
                            req.body['module'] = 'asset';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                            next();
                            break;
                        case '/' + global.config.version + '/asset/status/collection':
                            req.body['module'] = 'asset';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                            next();
                            break;
                        case '/' + global.config.version + '/pam/asset/passcode/check':
                            req.body['module'] = 'device';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                            next();
                            break;    
                        case '/' + global.config.version + '/pam/asset/passcode/alter/v1':
                            req.body['module'] = 'device';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                            next();
                            break;  
                        case '/' + global.config.version + '/asset/signup':
                            req.body['module'] = 'device';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                            next();
                            break;      
                        case '/' + global.config.version + '/email/passcode/generate':
                            req.body['module'] = 'device';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                            next();
                            break;    
                        case '/' + global.config.version + '/email/passcode/verify':
                            req.body['module'] = 'device';
                            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
                            next();
                            break;                                                                                                                              
                        case '/' + global.config.version + '/send/email':
                        case '/' + global.config.version + '/send/email/v3':
                        case '/' + global.config.version + '/send/email/v4':
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
                        case '/' + global.config.version + '/vodafone/manual_trigger/excel_upload/child_workflows_create':
                        case '/' + global.config.version + '/trigger/update/account/integrations':
                        case '/' + global.config.version + '/bot/esms/test_service':
                            req.body['module'] = 'asset';
                            next();
                            break;
                        case '/' + global.config.version + '/vil/temp-credentials/fetch':
                        case '/' + global.config.version + '/vil/s3-object/download':
                            next();
                            break;
                        case '/' + global.config.version + '/pam/payment/webhook/response':
                            next();
                            break;
                        case '/' + global.config.version + '/pam/payment/webhook/settlement/response':
                            next();
                            break;
                        case '/' + global.config.version + '/pam/payment/response':
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
                            global.logger.write('conLog', 'Module : ' + req.body['module'], {}, req.body);

                            var asset_id = req.body.auth_asset_id || req.body.asset_id;

                            
                            cacheWrapper.getTokenAuth(asset_id, function (err, encToken) {
                                if (err) {                               
                                    global.logger.write('appError', 'Redis token Checking error : ' + JSON.stringify(err), err, req.body);
                                    res.json(responseWrapper.getResponse(null, {}, -7998, req.body));
                                    return;
                                } else {                                    
                                    global.logger.write('conLog', 'got from cache layer : ' + encToken, {}, req.body);
                                    global.logger.write('conLog', 'got from request body : ' + req.body.asset_token_auth, {}, req.body);

                                    if (req.body.asset_token_auth === 'undefined') {
                                        global.logger.write('conLog', 'req.url : ' + req.url, {}, req.body);
                                        global.logger.write('serverError', 'Redis encToken checking failed : ' + JSON.stringify(err), {}, {});
                                        res.json(responseWrapper.getResponse(null, {}, -3204, req.body));
                                        return;
                                    } else if (encToken === req.body.asset_token_auth) {
                                        global.logger.write('conLog', 'successfully redis encToken checking is done', {}, {});
                                        next();
                                    } else {
                                        global.logger.write('conLog', 'req.url : ' + req.url, {}, req.body);
                                        global.logger.write('serverError', 'Redis encToken checking failed : ' + JSON.stringify(err), {}, {});
                                        res.json(responseWrapper.getResponse(null, {}, -3204, req.body));
                                        return;
                                    }
                                }

                            });

                            break;
                    } //switch
                //} //else
            } //else
        //}); //getServiceId
    }); //app.use
} // main function

module.exports = EncTokenInterceptor;
