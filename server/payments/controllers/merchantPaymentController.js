"use strict";

const MerchantPaymentService = require('../services/merchantPaymentService');
const moment = require('moment');
const logger = require('../../logger/winstonLogger');

function MerchantPaymentController(objCollection) {

    const responseWrapper = objCollection.responseWrapper;
    const app = objCollection.app;
    const merchantPaymentService = new MerchantPaymentService(objCollection);


    app.post('/' + global.config.version + '/pam/payment/getSignature', async (req, res) => {
        logger.info("-");
        logger.info("------- signature --------- start");
        const [err, data] = await merchantPaymentService.getSignature(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
            logger.info("------- signature --------- end");
        } else {
            logger.error("/pam/payment/getSignature| Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
            logger.info("------- signature --------- end");
        }
    });

    app.post('/' + global.config.version + '/pam/payment/createOrder', async (req, res) => {
        logger.info("-");
        logger.info("------- createorder ---------");
        const [err, data] = await merchantPaymentService.createOrder(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
            logger.info("------- createorder --------- end");
        } else {
            logger.error("/pam/payment/createOrder| Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
            logger.info("------- createorder --------- end");
        }
    });

    app.post('/' + global.config.version + '/pam/payment/response', async (req, res) => {
        logger.info("-");
        logger.info("------- payment response web --------- start");
        const [err, responseData] = await merchantPaymentService.handlePaymentResponse(req.body);
        if (!err) {
            logger.info("response = " + JSON.stringify(responseData));
            let data = Buffer.from(JSON.stringify(responseData)).toString('base64');
            let redirecturl = global.config.pamApplicationUrl + data;
            logger.info("redirecting to page : " + data);
            res.status(200).redirect(redirecturl);
            //res.send(responseWrapper.getResponse({}, responseData, 200, req.body));
            logger.info("------- payment response web --------- end");
        } else {
            logger.error("/pam/payment/response| Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
            logger.info("------- payment response web --------- end");
        }
    });

    app.post('/' + global.config.version + '/pam/payment/webhook/response', async (req, res) => {
        logger.info("-");
        logger.info("------- payment response webhook --------- start");
        const [err, data] = await merchantPaymentService.handlePaymentResponseThroughWebhook(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
            logger.info("------- payment response webhook --------- end");
        } else {
            logger.error("/pam/payment/webhook/response| Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
            logger.info("------- payment response webhook --------- end");
        }
    });

    app.post('/' + global.config.version + '/pam/get/organization/aquirer', async (req, res) => {
        logger.info("-");
        logger.info("------- get organization acquirer --------- start");
        const [err, data] = await merchantPaymentService.getAcquirerMappedToOrganization(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
            logger.info("------- get organization acquirer --------- end");
        } else {
            logger.error("/pam/get/organization/aquirer| Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
            logger.info("------- get organization acquirer --------- end");
        }
    });

    app.post('/' + global.config.version + '/pam/payment/statuscheck', async (req, res) => {
        logger.info("-");
        logger.info("------- statuscheck --------- start");
        const [err, data] = await merchantPaymentService.statusCheck(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
            logger.info("------- statuscheck --------- end");
        } else {
            logger.error("/pam/payment/statuscheck| Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
            logger.info("------- statuscheck --------- end");
        }
    });

    app.post('/' + global.config.version + '/pam/payment/createRefund', async (req, res) => {
        logger.info("------- createrefund ---------");
        const [err, data] = await merchantPaymentService.createRefund(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            logger.error("/pam/payment/createRefund| Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/payment/webhook/settlement/response', async (req, res) => {
        logger.info("------- Settlement Response ---------");
        const [err, data] = await merchantPaymentService.getSettlementResponse(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
        } else {
            logger.error("/pam/payment/webhook/settlement/response| Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
        }
    });

    app.post('/' + global.config.version + '/pam/payment/gatewayrouting', async (req, res) => {
        logger.info("-");
        logger.info("-------paymentGatewayRouting---------");
        const [err, data] = await merchantPaymentService.paymentGatewayRouting(req.body);
        if (!err) {
            res.send(responseWrapper.getResponse({}, data, 200, req.body));
            logger.info("------- paymentGatewayRouting --------- end");
        } else {
            logger.error("/pam/payment/gatewayrouting| Error: ", err);
            res.send(responseWrapper.getResponse(err, data, -9999, req.body));
            logger.info("------- gatewayrouting --------- end");
        }
    });
}
module.exports = MerchantPaymentController;