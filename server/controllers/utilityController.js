/*
 *author: Sri Sai Venkatesh 
 * 
 */


function UtilityController(objCollection) {

    var responseWrapper = objCollection.responseWrapper;
    var app = objCollection.app;

    app.post('/' + global.config.version + '/time/access/global/entry/collection', function (req, res) {

        var statusCode = 200;
        res.send(responseWrapper.getResponse(false, {}, statusCode,req.body));

    });


}


module.exports = UtilityController;