const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const https = require('https');
const TimeUuid = require('cassandra-driver').types.TimeUuid;

//const AWS_Cognito = require('aws-sdk');
//AWS_Cognito.config.update({
//    "accessKeyId": "AKIAWIPBVOFRSA6UUSRC",
//    "secretAccessKey": "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",
//    "region": "ap-south-1"
//});
//const cognitoidentityserviceprovider = new AWS_Cognito.CognitoIdentityServiceProvider();

//var map = new Map();

/*async function listUsers(paginationToken = null) {
	var params = {
		UserPoolId: global.config.user_pool_id,
		Limit: 60
	};

	//console.log('paginationToken : ', paginationToken);
	if(paginationToken != null) {
		params = {
            UserPoolId: global.config.user_pool_id,
            Limit: 60,
            PaginationToken: paginationToken
        };
	}

	await new Promise((resolve, reject)=>{
		cognitoidentityserviceprovider.listUsers(params, async (err, data)=>{
		if(err) {
			console.log(err);
		} else {
			//console.log(data);
			let users = data.Users;
			//console.log(users[0])
			console.log(users.length);
			
			//console.log(users[0].Username);
			//console.log(users[0].Attributes[1].Value);

			for(const i of users) {
				for(const j of i.Attributes) {
					if(j.Name === 'phone_number') {
						map.set(i.Username, j.Value);
					}
				}
			}
			
			if(data.PaginationToken != "" && Number(users.length) === 60) {
				await listUsers(data.PaginationToken);
			}

			resolve();			
		}
		});	
	});
	
}*/

/*async function nani() {
	await listUsers();
	console.log('In functino Nani : ', map.size);
	console.log(map);
}
nani();
console.log('Hello');*/

function AccessTokenInterceptor(app, responseWrapper, map) {
    let token, url, jwk, decoded, pem, keys;
    app.use((req, res, next) => {
        console.log('REQ : ', req.headers);
        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$'); 
                
        let bundleTransactionId = TimeUuid.now();
        req.body.service_id = "";
        req.body.bundle_transaction_id = bundleTransactionId;
        req.body.url = req.url;
                
        //Check for flag - Cognito or Redis Auth
        //x-grene-auth-flag = 1 - Redis
        //x-grene-auth-flag = 2 - Cognito
        if(Number(req.headers['x-grene-auth-flag']) === 1 || !(req.headers['x-grene-auth-flag'])) {
        //if(Number(req.headers['x-grene-auth-flag']) === 1) {
            console.log('Proceeding to Redis Auth coz x-grene-auth-flag is 1');
            next();
        } else if(req.body.url.includes('/' + global.config.version + '/healthcheck')) {
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
                    //console.log('decoded : ', decoded);
                    if(decoded === null) {
                        console.log('Invalid token');
                        res.send(responseWrapper.getResponse(null, {}, -3205, req.body));
                        return;
                    }

                    let userNameFromAccessToken = decoded.payload.username;

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
                            //console.log('DATA : ', data);
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
                            //console.log('PEM : ', pem);                            
                            
                            jwt.verify(token, pem, { algorithms: ['RS256'] }, async (err, decodedToken) => {
                            if(err === null) {
                                //get the username based on the given phonenumber
                                let params = {
                                        UserPoolId: global.config.user_pool_id,
                                        Username: '+' + '' + req.headers['x-grene-c-code'] + '' + req.headers['x-grene-p-code']
                                    };
                                let phoneNumber = '+' + '' + req.headers['x-grene-c-code'] + '' + req.headers['x-grene-p-code'];

                                //console.log('decodedToken : ', decodedToken);
                                console.log('UserName and phoneNumber from Accesstoken - ', userNameFromAccessToken,'-',phoneNumber);
                                //console.log('PARAMS : ', params);

                                if(map.has(userNameFromAccessToken)) {
                                    
                                    if(map.get(userNameFromAccessToken) === phoneNumber) {
                                        console.log('token verified successfully!');
                                        req.body.access_token_verified = 1;                                
                                        next();
                                    } else { 
                                        console.log('#########################################');
                                        console.log('Phone Number from the Mapped Username in Map: ', map.get(userNameFromAccessToken));
                                        console.log('Phone Number from Request Headers: ', phoneNumber);
                                        console.log('');
                                        console.log('User Name for Access Token : ', userNameFromAccessToken);
                                        console.log('');
                                        console.log('Invalid token - UserName does not match');
                                        console.log('#########################################');
                                        res.send(responseWrapper.getResponse(null, {}, -3205, req.body));
                                        return;
                                    }
                                } else {
                                    console.log('UserName from the accessToken is not present in the Map');
                                    res.send(responseWrapper.getResponse(null, {}, -3205, req.body));
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
                                    res.send(responseWrapper.getResponse(null, {}, -3205, req.body));
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
                                    res.send(responseWrapper.getResponse(null, {}, -3205, req.body));
                                    return;
                                }

                                /*cognitoidentityserviceprovider.adminGetUser(params, (err, data) => {
                                    if (err) {
                                        console.log(err, err.stack);
                                        console.log('Invalid token');
                                        res.send(responseWrapper.getResponse(null, {}, -3205, req.body));
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
                                            res.send(responseWrapper.getResponse(null, {}, -3205, req.body));
                                            return;
                                        }
                                    }
                                });*/
                                //});                                    
                                
                                
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