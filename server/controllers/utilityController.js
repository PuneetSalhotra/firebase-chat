/*
 *author: Sri Sai Venkatesh 
 * 
 */


function UtilityController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;

    app.post('/time/value', function (req, res) {

        var statusCode = 200;
        res.send(responseWrapper.getResponse(false, {}, statusCode));

    });


}


module.exports = UtilityController;