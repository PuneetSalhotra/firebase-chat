"use strict";

const MerchantPaymentService = require('../services/merchantPaymentService');
const moment = require('moment');
const logger = require('../../logger/winstonLogger');

function MerchantPaymentController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const merchantPaymentService = new MerchantPaymentService(objCollection);

    

    app.post('/' + global.config.version + '/pam/payment/getSignature', async (req, res) => {
        logger.info("\n------- signature ---------");
        const [err, data] = await merchantPaymentService.getSignature(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            logger.error("/pam/payment/getSignature| Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/payment/createOrder', async (req, res) => {
        logger.info("\n------- createorder ---------");
        const [err, data] = await merchantPaymentService.createOrder(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            logger.error("/pam/payment/createOrder| Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/payment/response', async (req, res) => {
        logger.info("\n------- payment response web ---------");
        const [err, data] = await merchantPaymentService.handlePaymentResponse(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            logger.error("/pam/payment/response| Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/payment/webhook/response', async (req, res) => {
        logger.info("\n------- payment response webhook ---------");
        const [err, data] = await merchantPaymentService.handlePaymentResponseThroughWebhook(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            logger.error("/pam/payment/webhook/response| Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/payment/statuscheck', async (req, res) => {
        logger.info("\n------- statuscheck ---------");
        const [err, data] = await merchantPaymentService.statusCheck(req.body);
        if (!err) {
            res.json(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            logger.error("/pam/payment/statuscheck| Error: ", err);
            res.json(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    // app.post('/' + global.config.version + '/pam/payment/createRefund', async (req, res) => {
    //     logger.info("\n------- createrefund ---------");
    //     const [err, data] = await merchantPaymentService.createRefund(req.body);
    //     if (!err) {
    //         res.json(responseWrapper.getResponse({}, data, 200, req.body));
    //     } else {
    //         logger.error("/pam/payment/createRefund| Error: ", err);
    //         res.json(responseWrapper.getResponse(err, data, -9999, req.body));
    //     }
    // });
}
module.exports = MerchantPaymentController;