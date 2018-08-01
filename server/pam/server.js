const app = require('express')();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
var makeRequest = require('request');

app.post('/pam/reservation/set', function (req, res) {
     invokeJavaPgm(req.body).then((data)=>{
        console.log('Activity_id : ', data);
        pamReservSet(req.body, data).then((resp)=>{
          res.send(resp);
        });
     });
});

function invokeJavaPgm(request){
      return new Promise((resolve, reject)=>{
          var exethis = 'java Invoker ' + request.event_id +' '+ request.no_of_guests +' '+ request.member_id +' '+ request.member_name +' ';
          exethis += request.member_phone_country_code +' '+request.member_phone_number;
          console.log('Command : ' + exethis);      

          var result = require('child_process').execSync(exethis).toString();
          //console.log('result: ', Number(result));
          resolve(result);
      });
}

function pamReservSet(request, result) {
    return new Promise((resolve, reject)=>{
        options = {
            form : 
              {asset_id : request.asset_id,
               asset_token_auth : request.asset_token_auth,
               no_of_guests:request.no_of_guests,
               member_name:request.member_name,
               country_code:request.member_phone_country_code,
               phone_number:request.member_phone_number, 
               activity_id:Number(result),
               organization_id: 351
              }
          }

        makeRequest.post('http://localhost:3000/0.1/pam/reservation/set', options, function (error, response, body) {
              console.log('body:', body);
              body = JSON.parse(body);
              var resp = {
                  status: body.status,
                  service_id: body.service_id || 0,
                  gmt_time: body.gmt_time,
                  response: body.response
              };
              //res.send(resp);
              resolve(resp);
            });
    });    
}

app.listen(3100, ()=>{
    console.log('Server is running on 3100 port');
});