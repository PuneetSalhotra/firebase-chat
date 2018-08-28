var makeRequest = require('request');

function callPasscodeAlter() {
    var newRequest = {};
    newRequest.organization_id =  336;
    newRequest.asset_phone_country_code = 91;
    newRequest.asset_phone_number = 9100112970;
    newRequest.verification_method = 1;    
                        
    console.log('newRequest: ', newRequest);
                        
    var options = { form : newRequest }

    makeRequest.put('http://localhost:3000/r1/asset/passcode/alter/v1', 
        options, 
        function (error, response, body) {
            console.log('body:', body);
            body = JSON.parse(body);
            console.log('error : ', error);
            var resp = {
                status: body.status,
                service_id: body.service_id || 0,
                gmt_time: body.gmt_time,
                response: body.response
            };
            //res.send(resp);
            console.log(resp);
    });    
}

//1000 1 sec
//60000 1 min
//60000 * 15 15 minutes
//900000
setInterval(callPasscodeAlter, 900000);