"use strict";

const MerchantPaymentService = require('../services/merchantPaymentService');
const moment = require('moment');

function MerchantPaymentController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const merchantPaymentService = new MerchantPaymentService(objCollection);

    app.post('/' + global.config.version + '/pam/payment/createOrder', async (req, res) => {
        const [err, data] = await merchantPaymentService.createOrder(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/pam/payment/createOrder| Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/payment/response', async (req, res) => {
        const [err, data] = await merchantPaymentService.handlePaymentResponse(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/pam/payment/response| Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/payment/getSignature', async (req, res) => {
        const [err, data] = await merchantPaymentService.getSignature(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            console.log("/pam/payment/getSignature| Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // app.post('/' + global.config.version + '/greneos/api/createSignature', async (req, res) => {
    //     const [err, data] = await merchantPaymentService.createSignature(req.body);
    //     if (!err) {
    //         res.send(responseWrapper.getResponse({}, data, 200, req.body));
    //     } else {
    //         console.log("/greneos/api/createSignature| Error: ", err);
    //         res.send(responseWrapper.getResponse(err, data, -9999, req.body));
    //     }
    // });
}
module.exports = MerchantPaymentController;