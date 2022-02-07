const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const https = require('https');
const TimeUuid = require('cassandra-driver').types.TimeUuid;
const logger = require("../logger/winstonLogger");
const moment = require('moment');
const { nanoid } = require('nanoid');

function AccessTokenInterceptor(app, responseWrapper, map, cacheWrapper) {
    let token, url, jwk, decoded, pem, keys;
    app.use(async (req, res, next) => {
        // console.log('REQ : ', req.headers);
        // console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$'); 

        let bundleTransactionId = TimeUuid.now();
        req.body.service_id = "";
        req.body.bundle_transaction_id = bundleTransactionId;
        req.body.url = req.url;

        if (req.body.hasOwnProperty("asset_id") && !req.url.includes('/' + global.config.version + '/healthcheck') && !req.body.hasOwnProperty("form_submitter_asset_id")) {
            req.body["form_submitter_asset_id"] = req.body.asset_id;
        }

        if (!req.body.hasOwnProperty("log_uuid") && !req.url.includes('/' + global.config.version + '/healthcheck')) {
            req.body["log_uuid"] = await getLogUUID();
            addInitialLog(req);
        }

        //Check for flag - Cognito or Redis Auth
        //x-grene-auth-flag = 1 - Redis
        //x-grene-auth-flag = 2 - Cognito
        if (Number(req.headers['x-grene-auth-flag']) === 1 || !(req.headers['x-grene-auth-flag'])) {
            //if(Number(req.headers['x-grene-auth-flag']) === 1) {
            logger.info(req.body.log_uuid + ' Proceeding to Redis Auth coz x-grene-auth-flag is 1');
            next();
        } else if (req.body.url.includes('/' + global.config.version + '/healthcheck')) {
            next();
        } else if (req.body.url.includes('/' + global.config.version + '/account/')) {
            req.body['module'] = 'asset';
            logger.info(req.body.log_uuid + ' bypassing enc token checking as request is from account %j', { request: req.body });
            next();
        } else if (req.body.url.includes('/' + global.config.version + '/zoho/')) {
            logger.info(req.body.log_uuid + JSON.stringify(req.body, null, 2));
            logger.info(req.body.log_uuid + ' bypassing enc token checking as request is for zoho services %j', { request: req.body });
            next();
        } else {
            switch (req.url) {
                case '/' + global.config.version + '/asset/passcode/alter':
                case '/' + global.config.version + '/asset/passcode/alter/v1':
                    //case '/' + global.config.version + '/sms-dlvry/sinfini':
                    //case '/' + global.config.version + '/sms-dlvry/nexmo':
                    //case '/' + global.config.version + '/sms-dlvry/twilio':
                    req.body['module'] = 'device';
                    logger.info(req.body.log_uuid + ' in  /asset/passcode/alter %j', { request: req.body });
                    next();
                    break;
                case '/' + global.config.version + '/asset/passcode/check':
                    req.body['module'] = 'device';
                    logger.info(req.body.log_uuid + ' in  /asset/passcode/check %j', { request: req.body });
                    next();
                    break;
                case '/' + global.config.version + '/asset/link/set':
                    req.body['module'] = 'asset';
                    logger.info(req.body.log_uuid + ' in  /asset/link/set %j', { request: req.body });
                    next();
                    break;
                case '/' + global.config.version + '/asset/phonenumber/access/organization/list':
                case '/' + global.config.version + '/phone_number/verify/invite':
                    req.body['module'] = 'asset';
                    logger.info(req.body.log_uuid + ' in  /asset/phonenumber/access/organization/list %j', { request: req.body });
                    next();
                    break;
                case '/' + global.config.version + '/pam/asset/cover/alter/clockin':
                    req.body['module'] = 'asset';
                    logger.info(req.body.log_uuid + ' in  /pam/asset/cover/alter/clockin %j', { request: req.body });
                    next();
                    break;
                case '/' + global.config.version + '/asset/status/collection':
                    req.body['module'] = 'asset';
                    logger.info(req.body.log_uuid + ' in  /asset/status/collection %j', { request: req.body });
                    next();
                    break;
                case '/' + global.config.version + '/pam/asset/passcode/check':
                    req.body['module'] = 'device';
                    logger.info(req.body.log_uuid + ' in  /pam/asset/passcode/check %j', { request: req.body });
                    next();
                    break;
                case '/' + global.config.version + '/pam/asset/passcode/alter/v1':
                    req.body['module'] = 'device';
                    logger.info(req.body.log_uuid + ' in  /pam/asset/passcode/alter/v1 %j', { request: req.body });
                    next();
                    break;
                case '/' + global.config.version + '/asset/signup':
                    req.body['module'] = 'device';
                    logger.info(req.body.log_uuid + ' in  /asset/signup %j', { request: req.body });
                    next();
                    break;
                case '/' + global.config.version + '/email/passcode/generate':
                    req.body['module'] = 'device';
                    logger.info(req.body.log_uuid + ' in  /email/passcode/generate %j', { request: req.body });
                    next();
                    break;
                case '/' + global.config.version + '/email/passcode/verify':
                    req.body['module'] = 'device';
                    logger.info(req.body.log_uuid + ' in  /email/passcode/verify %j', { request: req.body });
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
                case '/' + global.config.version + '/bot/esms/test_service':
                    req.body['module'] = 'asset';
                    next();
                    break;
                case '/' + global.config.version + '/vil/temp-credentials/fetch':
                case '/' + global.config.version + '/vil/s3-object/download':
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
                    logger.info(req.body.log_uuid + ' Module : ' + req.body['module']);

                    //let asset_id = req.body.auth_asset_id || req.body.asset_id;
                    token = req.headers.accesstoken;

                    // get the decoded payload and header
                    decoded = jwt.decode(token, { complete: true });
                    //console.log('decoded : ', decoded);
                    if (decoded === null) {
                        logger.info(req.body.log_uuid + 'Invalid token');
                        res.json(responseWrapper.getResponse(null, {}, -3205, req.body));
                        return;
                    }

                    let userNameFromAccessToken = decoded.payload.username;

                    logger.info(req.body.log_uuid + ' &&&&&&&&&&&&&&&&');
                    logger.info(req.body.log_uuid + " " + decoded.payload.iss);
                    logger.info(req.body.log_uuid + ' &&&&&&&&&&&&&&&&');

                    url = `${decoded.payload.iss}/.well-known/jwks.json`;
                    //url = `https://cognito-idp.${global.config.cognito_region}.amazonaws.com/${global.config.user_pool_id}/.well-known/jwks.json`;
                    //url = `https://cognito-idp.${global.config.cognito_region}.amazonaws.com/ap-south-1_DQ3ZEJi00/.well-known/jwks.json`;
                    logger.info(req.body.log_uuid + " " + url);

                    https.get(url, (resp) => {
                        let data = '';

                        // A chunk of data has been recieved.
                        resp.on('data', (chunk) => {
                            data += chunk;
                        });

                        // The whole response has been received. Print out the result.
                        resp.on('end', () => {
                            //console.log('DATA : ', data);
                            data = JSON.parse(data);
                            keys = data.keys;
                            //console.log(keys);

                            for (let i = 0; i < keys.length; i++) {
                                if (keys[i].kid === decoded.header.kid) {
                                    jwk = keys[i];
                                    break;
                                }
                            }
                            //console.log(jwk);
                            pem = jwkToPem(jwk);
                            //console.log('PEM : ', pem);                            

                            jwt.verify(token, pem, { algorithms: ['RS256'] }, async (err, decodedToken) => {
                                if (err === null) {
                                    //get the username based on the given phonenumber
                                    let params = {
                                        UserPoolId: global.config.user_pool_id,
                                        Username: '+' + '' + req.headers['x-grene-c-code'] + '' + req.headers['x-grene-p-code']
                                    };
                                    let phoneNumber = '+' + '' + req.headers['x-grene-c-code'] + '' + req.headers['x-grene-p-code'];

                                    if (req.headers['x-grene-e-flag'] == 1) {
                                        phoneNumber = req.headers['x-grene-e'].toLowerCase();
                                    }
                                    //console.log('decodedToken : ', decodedToken);
                                    logger.info(req.body.log_uuid + ' UserName and phoneNumber/Email from Accesstoken - ' + userNameFromAccessToken + '-' + phoneNumber);
                                    //console.log('PARAMS : ', params);

                                    //if(map.has(userNameFromAccessToken)) {
                                    //    
                                    //    if(map.get(userNameFromAccessToken) === phoneNumber) {
                                    //        console.log('token verified successfully!');
                                    //        req.body.access_token_verified = 1;                                
                                    //        next();
                                    //    } else { 
                                    //        console.log('#########################################');
                                    //        console.log('Phone Number from the Mapped Username in Map: ', map.get(userNameFromAccessToken));
                                    //        console.log('Phone Number from Request Headers: ', phoneNumber);
                                    //        console.log('');
                                    //        console.log('User Name for Access Token : ', userNameFromAccessToken);
                                    //        console.log('');
                                    //        console.log('Invalid token - UserName does not match');
                                    //        console.log('#########################################');
                                    //        res.json(responseWrapper.getResponse(null, {}, -3205, req.body));
                                    //        return;
                                    //    }
                                    //} else {
                                    //    console.log('UserName from the accessToken is not present in the Map');
                                    //    res.json(responseWrapper.getResponse(null, {}, -3205, req.body));
                                    //    return;
                                    //}

                                    let tempVar = await cacheWrapper.getUserNameFromAccessToken(userNameFromAccessToken);
                                    logger.info(req.body.log_uuid + ' UserNameFromAccessToken - ' + tempVar);

                                    if (req.headers['x-grene-e-flag'] == 1) {
                                        tempVar = tempVar.toLowerCase();
                                    }

                                    if (tempVar !== 'undefined') {
                                        if (tempVar === phoneNumber) {
                                            logger.info(req.body.log_uuid + ' token verified successfully!');
                                            req.body.access_token_verified = 1;
                                            next();
                                        } else {
                                            logger.info(req.body.log_uuid + ' #########################################');
                                            logger.info(req.body.log_uuid + ' Phone Number/Email from the Mapped Username in Redis: ' + tempVar);
                                            logger.info(req.body.log_uuid + ' Phone Number/Email from Request Headers: ' + phoneNumber);
                                            logger.info(req.body.log_uuid + ' User Name from Access Token : ' + userNameFromAccessToken);
                                            logger.info(req.body.log_uuid + ' Invalid token - UserName does not match');
                                            logger.info(req.body.log_uuid + ' #########################################');
                                            res.json(responseWrapper.getResponse(null, {}, -3205, req.body));
                                            return;
                                        }
                                    } else {
                                        logger.info(req.body.log_uuid + 'UserName from the accessToken is not present in the Redis');
                                        res.json(responseWrapper.getResponse(null, {}, -3205, req.body));
                                        return;
                                    }

                                    //await new Promise(()=>{
                                    /*let phoneNumber = '+' + '' + req.headers['x-grene-c-code'] + '' + req.headers['x-grene-p-code'];
                                    var params1 = {
                                        UserPoolId: global.config.user_pool_id,
                                        //AttributesToGet: [
                                        //	'phone_number',
                                        //	//'Username'
                                        //],
                                        //Filter: "username = \"07c477f9-f6e5-4b96-b9cd-24eb535ff533\" AND phone_number = \"+919502266634\"" ,
                                        //Filter: "phone_number = \"+919502266633\" AND username = \"07c477f9-f6e5-4b96-b9cd-24eb535ff533\"" ,
                                        Filter: "phone_number = \"" +  phoneNumber + "\"",
                                        Limit: 1
                                    };
                                    let userNameFromCognito = await cognitoidentityserviceprovider.listUsers(params1).promise();
                                    //let userNameFromCognito = await cognitoidentityserviceprovider.adminGetUser(params).promise();
                                    console.log('userNameFromCognito : ', userNameFromCognito);
    
                                    let user = userNameFromCognito.Users;
                                    if(user.length === 0) {
                                        console.log('No User Found');
                                        res.json(responseWrapper.getResponse(null, {}, -3205, req.body));
                                        return;
                                    }
                                    console.log(user[0]);
    
                                    if(user[0].Username === decoded.payload.username) {
                                        console.log('token verified successfully!');
                                        req.body.access_token_verified = 1;                                
                                        next();
                                    } else {
                                        console.log('#########################################');
                                        console.log('From cognito User Name : ', user[0].Username);
                                        console.log('typeof From cognito User Name : ', typeof user[0].Username);
    
                                        console.log('From Access token : ', decoded.payload.username);
                                        console.log('typeof From Access token : ', typeof decoded.payload.username);
    
                                        console.log('Invalid token - UserName does not match');
                                        console.log('#########################################');
                                        res.json(responseWrapper.getResponse(null, {}, -3205, req.body));
                                        return;
                                    }
    
                                    /*cognitoidentityserviceprovider.adminGetUser(params, (err, data) => {
                                        if (err) {
                                            console.log(err, err.stack);
                                            console.log('Invalid token');
                                            res.json(responseWrapper.getResponse(null, {}, -3205, req.body));
                                            return;
                                        } else {
                                            console.log('User Data : ', data);
                                            let userNameFromCognito = data.Username;
    
                                            if(userNameFromCognito === userNameFormAccesstoken) {
                                                console.log('token verified successfully!');
                                                req.body.access_token_verified = 1;                                
                                                next();
                                            } else {
                                                console.log('From cognito User Name : ', data.Username);
                                                console.log('typeof From cognito User Name : ', typeof data.Username);
    
                                                console.log('From Access token : ', decoded.payload.username);
                                                console.log('typeof From Access token : ', typeof decoded.payload.username);
    
                                                console.log('Invalid token - UserName does not match');
                                                res.json(responseWrapper.getResponse(null, {}, -3205, req.body));
                                                return;
                                            }
                                        }
                                    });*/
                                    //});                                    


                                } else {
                                    logger.error(req.body.log_uuid + ' Some error in the token Verification');
                                    logger.error(req.body.log_uuid + ' req.url : ' + req.url);
                                    logger.error(req.body.log_uuid + ' serverError' + 'Error in token verification : ', { err });
                                    res.json(responseWrapper.getResponse(null, { 'message': err }, -3205, req.body));
                                }
                            });

                        });

                    }).on("error", (err) => {
                        logger.error(req.body.log_uuid + " Error: " + err.message);
                        logger.error(req.body.log_uuid + ' serverError' + 'Error in token verification : ', { err });
                        res.json(responseWrapper.getResponse(null, {}, -3205, req.body));
                    });
                    break;
            } //switch
            //} //else
        } //else
        //}); //getServiceId
    }); //app.use

    let getLogUUID = async function () {
        return nanoid(13)
    };

    let addInitialLog = async function (request) {
        try {

            let activityID = "-";
            let assetID = "-";
            let assetPhoneNumber = "-";
            let logUUID = request.body["log_uuid"];
            let emailID = "-";
            let dateTime = moment().utc().format("YYYY-MM-DD HH:mm:ss");

            if (request.body.hasOwnProperty("activity_id")) {
                activityID = request.body.activity_id;
            }

            if (request.body.hasOwnProperty("asset_id")) {
                assetID = request.body.asset_id;
            }

            if (request.headers.hasOwnProperty('x-grene-p-code')) {
                assetPhoneNumber = request.headers['x-grene-p-code'];
            } else if (request.body.hasOwnProperty('asset_phone_number')) {
                assetPhoneNumber = request.body.asset_phone_number;
            }

            logger.info(`MAIN_REQUEST_START | ${request.url.split("/").join("-")} | ${activityID} | ${logUUID} | ${assetID} | ${assetPhoneNumber} | ${emailID} | ${dateTime} `);
        } catch (e) {
            logger.error("Error in adding initial log ", { error: e });
        }

    }
}

module.exports = AccessTokenInterceptor;