const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const https = require('https');
const TimeUuid = require('cassandra-driver').types.TimeUuid;

function AccessTokenInterceptor(app, responseWrapper) {
    let token, url, jwk, decoded, pem, keys;
    app.use((req, res, next) => {
        console.log('REQ : ', req.headers);
        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$'); 
                
        let bundleTransactionId = TimeUuid.now();
        req.body.service_id = "";
        req.body.bundle_transaction_id = bundleTransactionId;
        req.body.url = req.url;
                
        //Check for flag - Cognito or Redis Auth
        //flag = 1 - Redis
        //flag = 2 - Cognito
        //if(!req.headers.hasOwnProperty('x-grene-auth-flag')) {
        //    console.log('Proceeding to Redis Auth coz x-grene-auth-flag is not there');
        //    next();
        //} else if(
        //        //(req.headers.hasOwnProperty('authenticationflag') && Number(req.headers.authenticationflag) === 1) ||
        //        (req.headers.hasOwnProperty('x-grene-auth-flag') && Number(req.headers['x-grene-auth-flag']) === 1)
        //    )
        //{
        //    console.log('Proceeding to Redis Auth - x-grene-auth-flag : ', Number(req.headers['x-grene-auth-flag']));
        //    next();
        //} else 
        if(!req.headers.hasOwnProperty('accesstoken')) {
            console.log('Proceeding to Redis');
            next();
        }
        else if(req.body.url.includes('/' + global.config.version + '/healthcheck')) {
            next();
        } else if (req.body.url.includes('/' + global.config.version + '/account/')) {
            req.body['module'] = 'asset';
            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
            global.logger.write('conLog', 'bypassing enc token checking as request is from account', {}, req.body);
            next();
        } else if (req.body.url.includes('/' + global.config.version + '/zoho/')) {
            global.logger.write('request', JSON.stringify(req.body, null, 2), {}, {});
            global.logger.write('conLog', 'bypassing enc token checking as request is for zoho services', {}, req.body);
            next();
        } else {
            switch (req.url) {                        
                case '/' + global.config.version + '/asset/passcode/alter':
                case '/' + global.config.version + '/asset/passcode/alter/v1':
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
                    next();
                    break;
                // Stats cases
                case '/' + global.config.version + '/stats/signup/count':
                case '/' + global.config.version + '/stats/signup/list':
                case '/' + global.config.version + '/stats/timeline/list':
                case '/' + global.config.version + '/vodafone/manual_trigger/excel_upload/child_workflows_create':
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
                            
                    global.logger.write('conLog', 'Module : ' + req.body['module'], {}, req.body);

                    //let asset_id = req.body.auth_asset_id || req.body.asset_id;
                    token = req.headers.accesstoken;
                            
                    // get the decoded payload and header
                    decoded = jwt.decode(token, {complete: true});
                    //console.log(decoded);
                    if(decoded === null) {
                        console.log('Invalid token');
                        res.send(responseWrapper.getResponse(null, {}, -3205, req.body));
                        return;
                    }
                    //console.log(' ');                        
                            
                    url = `https://cognito-idp.${global.config.cognito_region}.amazonaws.com/${global.config.user_pool_id}/.well-known/jwks.json`;
                    //url = `https://cognito-idp.${global.config.cognito_region}.amazonaws.com/ap-south-1_U5xHOaPMS/.well-known/jwks.json`;
                    console.log(url);
                            
                    https.get(url, (resp) => {
                        let data = '';
                                
                        // A chunk of data has been recieved.
                        resp.on('data', (chunk) => {
                            data += chunk;
                        });
                            
                        // The whole response has been received. Print out the result.
                        resp.on('end', () => {  	
                            //console.log(data);
                            data = JSON.parse(data);
                            keys = data.keys;
                            //console.log(keys);
                            
                            for(let i=0; i<keys.length; i++) {
                                if(keys[i].kid === decoded.header.kid) {    		
                                    jwk = keys[i];
                                    break;
                                }
                            }
                            //console.log(jwk);                                
                            pem = jwkToPem(jwk);
                            //console.log(pem);
                            
                            jwt.verify(token, pem, { algorithms: ['RS256'] }, function(err, decodedToken) {
                            if(err === null) {
                                console.log('token verified successfully!');
                                req.body.access_token_verified = 1;                                
                                next();
                            } else {
                                console.log('Some error in the token Verification');
                                global.logger.write('conLog', 'req.url : ' + req.url, {}, req.body);
                                global.logger.write('serverError', 'Error in token verification : ' + JSON.stringify(err), {}, {});                                
                                res.send(responseWrapper.getResponse(null, {'message':err}, -3205, req.body));
                            }
                            });
                            
                        });
                            
                    }).on("error", (err) => {
                        console.log("Error: " + err.message);
                        global.logger.write('serverError', 'Error in token verification : ' + JSON.stringify(err), {}, {});
                                res.send(responseWrapper.getResponse(null, {}, -3205, req.body));
                        });
                    break;
                    } //switch
                //} //else
            } //else
        //}); //getServiceId
    }); //app.use
     
}

module.exports = AccessTokenInterceptor;