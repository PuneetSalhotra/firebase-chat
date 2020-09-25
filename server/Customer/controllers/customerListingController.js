const CustomerListingService = require("../services/customerListingService");

function CustomerListingController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const util = objCollection.util;
    const customerListingService = new CustomerListingService(objCollection);
    // const activityCommonService = objCollection.activityCommonService;

    // Fetch nearest Field Executive
    app.post('/' + global.config.version + '/customer/nearest_fe/list', async function (req, res) {
        const [err, feData] = await customerListingService.fetchNearestFieldExecutive(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, feData, 200, req.body));
        } else {
            console.log("/customer/nearest_fe/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, err, -9999, req.body));
        }
    });

    // Fetch nearest Field Executive
    app.post('/' + global.config.version + '/customer/field_executive/booked_workflows/list', async function (req, res) {
        const [err, feData] = await customerListingService.getFieldExecutiveBookedTimeslotActivities(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, feData, 200, req.body));
        } else {
            console.log("/customer/field_executive/booked_workflows/list | Error: ", err);
            res.send(responseWrapper.getResponse(err, err, -9999, req.body));
        }
    });

}

module.exports = CustomerListingController;
