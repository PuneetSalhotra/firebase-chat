"use strict";

const logger = require('../../logger/winstonLogger');
const PaymentUtil = require('../utils/paymentUtil');
const requestServer = require("request");
const moment = require('moment');
function PayPhiPaymentGatewayService(objCollection) {

    const util = objCollection.util;

    const paymentUtil = new PaymentUtil(objCollection);

    this.verifyResponseHash = function (request, context) {
        logger.debug("verifyResponseHash=>", JSON.stringify(request));
        let key = context.merchantParamData.param_1;
        let salt = context.merchantParamData.param_2;
        let isValidKey = false;
        if (request.key === key) {
            isValidKey = true;
        }
        let status = request.status;
        let txnid = request.txnid;
        let amount = request.amount;
        let productinfo = request.productinfo;
        let firstname = request.firstname;
        let email = request.email;
        let udf1 = request.udf1;
        let udf2 = request.udf2;
        let udf3 = request.udf3;
        let udf4 = request.udf4;
        let udf5 = request.udf5;
        let requestHash = request.secureHash;
        let hashtext = salt + status + udf5 + udf4 + udf3 + udf2 + udf1 + email + firstname + productinfo + amount + txnid + key;
        logger.debug("hashtext = " + hashtext);
        let hash = paymentUtil.sha256InHEX(hashtext);

        logger.debug("requested hash = " + requestHash);
        logger.debug("generated hash = " + hash);
        if (requestHash === hash && isValidKey) {
            return true;
        } else {
            return false;
        }
    }

    this.verifySettlementResponseHash = function (request, context) {

        let addlParam1 = request.addlParam1;
        let aggregatorID = request.aggregatorID;
        let cardNetwork = request.cardNetwork;
        let invoiceNos = request.invoiceNos;
        let merchantId = request.merchantId;
        let merchantTxnNo = request.merchantTxnNo;
        let paymentMode = request.paymentMode;
        let paymentSubInstType = request.paymentSubInstType;
        let serviceTax = request.serviceTax;
        let settledAmount = request.settledAmount;
        let settlementAccount = request.settlementAccount;
        let settlementAccountIFSC = request.settlementAccountIFSC;
        let settlementDate = request.settlementDate;
        let settlementID = request.settlementID;
        let txnAmount = request.txnAmount;
        let txnChannel = request.txnChannel;
        let txnCharges = request.txnCharges;

        let hashtext = '';
        
        if(addlParam1)
            hashtext = hashtext + aggregatorID;
        if(aggregatorID)
            hashtext = hashtext + aggregatorID;
        if(cardNetwork)
            hashtext = hashtext + cardNetwork;
        if(invoiceNos)
            hashtext = hashtext + invoiceNos;
        if(merchantId)
            hashtext = hashtext + merchantId;
        if(merchantTxnNo)
            hashtext = hashtext + merchantTxnNo;
        if(paymentMode)
            hashtext = hashtext + paymentMode;
        if(paymentSubInstType)
            hashtext = hashtext + paymentSubInstType;
        if(serviceTax)
            hashtext = hashtext + serviceTax;
        if(settledAmount)
            hashtext = hashtext + settledAmount;
        if(settlementAccount)
            hashtext = hashtext + settlementAccount;
        if(settlementAccountIFSC)
            hashtext = hashtext + settlementAccountIFSC;
        if(settlementDate)
            hashtext = hashtext + settlementDate;
        if(settlementID)
            hashtext = hashtext + settlementID;
        if(settlementID)
            hashtext = hashtext + settlementID;
        if(txnAmount)
            hashtext = hashtext + txnAmount;
        if(txnChannel)
            hashtext = hashtext + txnChannel;
        if(txnChannel)
            hashtext = hashtext + txnChannel;
        if(txnCharges)
            hashtext = hashtext + txnCharges;

        logger.debug("verifyResponseHash=>", JSON.stringify(request));
        let key = Buffer.from(context.gatewayData.param_3, 'base64');
        let requestHash = request.secureHash;

        logger.debug("hashtext = " + hashtext);
        let hash = paymentUtil.hmacSha256(hashtext, key);

        logger.debug("requested hash = " + requestHash);
        logger.debug("generated hash = " + hash);
        if (requestHash === hash) {
            return true;
        } else {
            return false;
        }

    }

    this.createOrder = async function (request, context) {
        logger.info("PayPhiPaymentGatewayService : createOrder: merchant_id = " + request.merchant_id +
            " merchant_txn_ref_no = " + request.merchant_txn_ref_no);

        let promise = new Promise((resolve, reject) => {
            let key = Buffer.from(context.gatewayData.param_3, 'base64');

            let paymenturl = context.gatewayData.gateway_host_name + context.gatewayData.gateway_param_1;

            // let amount = Number(request.amount).toFixed(2);

            //Need to change.
            let paymentresponseurl = context.gatewayData.param_1;
            // let paymentresponseurl = "http://localhost:7000/r1/pam/payment/response";


            let merchantID = context.merchantParamData.acqmerchant_id;
            let merchantTxnNo = request.merchant_txn_ref_no;
            let amount = Number(request.amount).toFixed(2).toString();
            let remarks = request.description || " ";
            let customerName = request.firstname || "dummy";
            let customerEmailID = "payments@grenerobotics.com";
            let customerMobileNo = request.customer_mobile_no;
            let addlParam1 = request.merchant_id;
            let addlParam2 = "PayPhi";
            let aggregatorID = context.gatewayData.param_2;
            let currencyCode = "356";
            let transactionType = "SALE";
            let txnDate = util.getCurrentUTCTime("YYYYMMDDHHmmss");

            let hashtext = addlParam1 + addlParam2 + aggregatorID + amount + currencyCode + customerEmailID + customerMobileNo + customerName + merchantID + merchantTxnNo + paymentresponseurl + transactionType + txnDate;

            logger.debug("hashtext = " + hashtext);
            let hash = paymentUtil.hmacSha256(hashtext, key);
            logger.debug("hash = " + hash);

            let options = {
                actionUrl: paymenturl,
                secureHash: hash,
                addlParam1: addlParam1,
                addlParam2: addlParam2,
                aggregatorID: aggregatorID,
                amount: amount,
                currencyCode: currencyCode,
                customerEmailID: customerEmailID,
                customerMobileNo: customerMobileNo,
                customerName: customerName,
                merchantID: merchantID,
                merchantTxnNo: merchantTxnNo,
                returnUrl: paymentresponseurl,
                transactionType: transactionType,
                txnDate: txnDate
            };
            context.options = options;
            context.paymentTransactionData.auth_no = null;
            logger.info("merchant_id = " + request.merchant_id + " merchant_txn_ref_no = " + request.merchant_txn_ref_no);
            logger.info("PayPhiPaymentGatewayService : createOrder: response : " + JSON.stringify(options));
            resolve([false, context]);

        });

        return promise;

    }

    this.fetchPaymentsByUsingOrderId = async function (request, context) {
        let payu_payment_id = context.paymentTransactionData.auth_no;

        logger.info("PayUPaymentGatewayService : fetchPaymentsByUsingOrderId: payphipayment_id = " + payu_payment_id);

        let promise = new Promise((resolve, reject) => {
            let txnid = context.paymentTransactionData.merchant_txn_ref_no;
            let payu_payment_id = context.paymentTransactionData.auth_no;
            let key = context.merchantParamData.param_1;
            let salt = context.merchantParamData.param_2;

            let transactionType = "STATUS";
            let merchantID = context.merchantParamData.acqmerchant_id;
            let merchantTxnNo = request.merchant_txn_ref_no;
            let aggregatorID = context.gatewayData.param_2;


            let queryString = "merchantID=" + merchantID + "&originalTxnNo=" + merchantTxnNo + "&aggregatorID=" + aggregatorID + "&transactionType=" + transactionType;

            logger.debug("queryString = " + queryString);

            let postserviceurl = context.gatewayData.gateway_host_name + context.gatewayData.gateway_param_2;

            //rejectUnauthorized : false,
            requestServer.post({
                url: postserviceurl,
                body: queryString,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            },
                function (error, response, body) {
                    logger.debug("body===========>");
                    logger.debug(body);

                    logger.error("error===========>");
                    logger.error(error);

                    if (!error && response.statusCode == 200) {
                        if (body !== undefined) {
                            logger.debug(body);

                            try {

                                let statusresponse = JSON.parse(response.body || '{}');

                                if ((statusresponse.responseCode == '000' || statusresponse.responseCode == '0000') && (statusresponse.txnResponseCode == '000' || statusresponse.txnResponseCode == '0000') && ("SUC" === statusresponse.txnStatus)) {
                                    context.paymentTransactionData.auth_no = statusresponse.txnID;
                                    context.paymentTransactionData.auth_id = statusresponse.txnAuthID;
                                    context.paymentTransactionData.acq_resp_date_time = moment(statusresponse.paymentDateTime, 'YYYYMMDDHHmmss').toDate();
                                    context.paymentTransactionData.acquirer_response_code = statusresponse.txnResponseCode;

                                    context.paymentTransactionData.response_code = "00";
                                    context.paymentTransactionData.payment_status = "SUC";
                                    context.paymentTransactionData.response_desc = statusresponse.txnRespDescription;

                                    context.paymentTransactionData.str_fld_1 = "STATUS_CHECK";
                                    context.paymentTransactionData.str_fld_4 = body;
                                    context.paymentTransactionData.payment_inst_type = statusresponse.paymentMode;

                                    if ("Card" === statusresponse.paymentMode) {
                                        context.paymentTransactionData.masked_payment_inst_id = statusresponse.card_no;
                                        context.paymentTransactionData.card_network = statusresponse.card_type;
                                        context.paymentTransactionData.payment_inst_type = "CARD";
                                        context.paymentTransactionData.payment_inst_sub_type = statusresponse.paymentSubInstType;
                                    }
                                    if ("NB" === statusresponse.paymentMode) {
                                        context.paymentTransactionData.payment_inst_type = "NB";
                                        context.paymentTransactionData.payment_inst_sub_type = statusresponse.paymentSubInstType;
                                    }
                                    if ("UPI" === statusresponse.paymentMode) {
                                        context.paymentTransactionData.masked_payment_inst_id = statusresponse.field1;
                                        context.paymentTransactionData.payment_inst_type = "UPI";
                                    }
                                } else if ("REJ" === statusresponse.txnStatus) {
                                    context.paymentTransactionData.auth_no = statusresponse.txnID;
                                    context.paymentTransactionData.auth_id = statusresponse.txnAuthID;
                                    context.paymentTransactionData.acq_resp_date_time = moment(statusresponse.paymentDateTime, 'YYYYMMDDHHmmss').toDate();
                                    context.paymentTransactionData.acquirer_response_code = statusresponse.txnResponseCode;

                                    context.paymentTransactionData.response_code = "39";
                                    context.paymentTransactionData.payment_status = "FAI";
                                    context.paymentTransactionData.response_desc = statusresponse.txnRespDescription;

                                    context.paymentTransactionData.str_fld_1 = "STATUS_CHECK";
                                    context.paymentTransactionData.str_fld_4 = body;
                                    context.paymentTransactionData.payment_inst_type = statusresponse.paymentMode;

                                    if ("Card" === statusresponse.paymentMode) {
                                        context.paymentTransactionData.masked_payment_inst_id = statusresponse.card_no;
                                        context.paymentTransactionData.card_network = statusresponse.card_type;
                                        context.paymentTransactionData.payment_inst_type = "CARD";
                                        context.paymentTransactionData.payment_inst_sub_type = statusresponse.paymentSubInstType;
                                    }
                                    if ("NB" === statusresponse.paymentMode) {
                                        context.paymentTransactionData.payment_inst_type = "NB";
                                        context.paymentTransactionData.payment_inst_sub_type = statusresponse.paymentSubInstType;
                                    }
                                    if ("UPI" === statusresponse.paymentMode) {
                                        context.paymentTransactionData.masked_payment_inst_id = statusresponse.field1;
                                        context.paymentTransactionData.payment_inst_type = "UPI";
                                    }
                                }
                            } catch (error) {
                                logger.error("Exception--------", error.stack, error);
                                logger.error(error);
                                logger.error("Exception--------");
                            }

                            resolve([false, context]);
                        } else {
                            resolve([true, { "errormsg": "Invalid Order" }]);
                        }
                    } else {
                        resolve([true, { "errormsg": "Invalid Order" }]);
                    }
                });
        });

        return promise;
    }

    this.createRefund = async function (request, context) {
        let payphi_payment_id = context.paymentTransactionData.auth_no;
        let merchantID = context.paymentTransactionData.acquirer_merchant_id;
        let aggregatorID = context.gatewayData.param_2;
        let merchantTxnNo = context.paymentTransactionData.merchant_txn_ref_no + '1';
        let originalTxnNo = context.paymentTransactionData.merchant_txn_ref_no;

        logger.info("PayPhiPaymentGatewayService : createRefund: payphi_payment_id = " + payphi_payment_id);

        let promise = new Promise((resolve, reject) => {
            let payphi_payment_id = context.paymentTransactionData.auth_no;
            let amount = Number(request.amount).toFixed(2);
            let tokenId = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

            let hashtext = aggregatorID + amount + merchantID + originalTxnNo + "Refund";
            logger.debug("hashtext = " + hashtext);
            let key = Buffer.from(context.gatewayData.param_3, 'base64');

            let secureHash = paymentUtil.hmacSha256(hashtext, key);

            logger.debug("secureHash = " + secureHash);

            let queryString = "merchantID=" + merchantID
                + "&aggregatorID=" + aggregatorID
                + "&originalTxnNo=" + originalTxnNo
                + "&amount=" + amount
                + "&transactionType=Refund"
                + "&secureHash=" + secureHash;
            logger.debug("queryString = " + queryString);

            let postserviceurl = context.gatewayData.gateway_host_name + context.gatewayData.gateway_param_2;

            console.log("postserviceurl", postserviceurl)
            //rejectUnauthorized : false,
            requestServer.post({
                url: postserviceurl,
                body: queryString,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            },
                function (error, response, body) {
                    logger.debug("body===========>");
                    logger.debug(body);
                    logger.debug(JSON.stringify(response));
                    logger.error("error===========>");
                    logger.error(error);

                    if (!error && response.statusCode == 200) {
                        if (body !== undefined) {
                            logger.debug(body);
                            try {
                                let jsonbody = JSON.parse(body);
                                console.log("jsonbody", JSON.stringify(jsonbody));
                                context.paymentTransactionData.str_fld_3 = null;
                                if (jsonbody.responseCode === "P1000") {
                                    context.paymentTransactionData.auth_no = jsonbody.txnID;
                                    context.paymentTransactionData.auth_id = null;
                                    context.paymentTransactionData.response_desc = jsonbody.respDescription;
                                    context.paymentTransactionData.acquirer_response_code = jsonbody.responseCode;
                                    context.paymentTransactionData.amount = amount;
                                    context.paymentTransactionData.payment_status = "SUC";
                                    context.paymentTransactionData.str_fld_1 = "Refund";
                                    context.paymentTransactionData.str_fld_4 = jsonbody;
                                    context.paymentTransactionData.acq_resp_date_time = moment(jsonbody.paymentDateTime, 'YYYYMMDDHHmmss').toDate();
                                } else {
                                    context.paymentTransactionData.payment_status = "FAI";
                                    context.paymentTransactionData.auth_no = jsonbody.txnID;
                                    context.paymentTransactionData.auth_id = null;
                                    context.paymentTransactionData.response_desc = jsonbody.respDescription;
                                    context.paymentTransactionData.acquirer_response_code = jsonbody.responseCode;
                                    context.paymentTransactionData.amount = amount;
                                    context.paymentTransactionData.acq_resp_date_time = moment(jsonbody.paymentDateTime, 'YYYYMMDDHHmmss').toDate();
                                    context.paymentTransactionData.str_fld_1 = "Refund Failed";
                                    context.paymentTransactionData.str_fld_4 = jsonbody;
                                }
                            } catch (error) {
                                logger.error("PayPhi Refund Exception--------");
                                logger.error(error);
                            }
                            resolve([false, context]);
                        } else {
                            resolve([true, { "errormsg": "Invalid Order" }]);
                        }
                    } else {
                        resolve([true, { "errormsg": "Invalid Order" }]);
                    }
                });
        });

        return promise;

    }

    this.fetchPaymentByUsingPaymentId = async function (request, context) {
        let payu_payment_id = context.paymentTransactionData.auth_no;

        logger.info("PayUPaymentGatewayService : fetchPaymentByUsingPaymentId: payphipayment_id = " + payu_payment_id);

        let promise = new Promise((resolve, reject) => {
            let txnid = context.paymentTransactionData.merchant_txn_ref_no;
            let payu_payment_id = context.paymentTransactionData.auth_no;
            let key = context.merchantParamData.param_1;
            let salt = context.merchantParamData.param_2;

            let transactionType = "STATUS";
            let merchantID = context.merchantParamData.acqmerchant_id;
            let merchantTxnNo = request.merchant_txn_ref_no;
            let aggregatorID = context.gatewayData.param_2;


            let queryString = "merchantID=" + merchantID + "&originalTxnNo=" + merchantTxnNo + "&aggregatorID=" + aggregatorID + "&transactionType=" + transactionType;

            logger.debug("queryString = " + queryString);

            let postserviceurl = context.gatewayData.gateway_host_name + context.gatewayData.gateway_param_2;

            //rejectUnauthorized : false,
            requestServer.post({
                url: postserviceurl,
                body: queryString,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            },
                function (error, response, body) {
                    logger.debug("body===========>");
                    logger.debug(body);

                    logger.error("error===========>");
                    logger.error(error);

                    if (!error && response.statusCode == 200) {
                        if (body !== undefined) {
                            logger.debug(body);

                            try {

                                let statusresponse = JSON.parse(response.body || '{}');

                                if ((statusresponse.responseCode == '000' || statusresponse.responseCode == '0000') && (statusresponse.txnResponseCode == '000' || statusresponse.txnResponseCode == '0000') && ("SUC" === statusresponse.txnStatus)) {
                                    context.paymentTransactionData.auth_no = statusresponse.txnID;
                                    context.paymentTransactionData.auth_id = statusresponse.txnAuthID;
                                    context.paymentTransactionData.acq_resp_date_time = moment(statusresponse.paymentDateTime, 'YYYYMMDDHHmmss').toDate();
                                    context.paymentTransactionData.acquirer_response_code = statusresponse.txnResponseCode;

                                    context.paymentTransactionData.response_code = "00";
                                    context.paymentTransactionData.payment_status = "SUC";
                                    context.paymentTransactionData.response_desc = statusresponse.txnRespDescription;

                                    context.paymentTransactionData.str_fld_1 = "STATUS_CHECK";
                                    context.paymentTransactionData.str_fld_4 = body;
                                    context.paymentTransactionData.payment_inst_type = statusresponse.paymentMode;

                                    if ("Card" === statusresponse.paymentMode) {
                                        context.paymentTransactionData.masked_payment_inst_id = statusresponse.card_no;
                                        context.paymentTransactionData.card_network = statusresponse.card_type;
                                        context.paymentTransactionData.payment_inst_type = "CARD";
                                        context.paymentTransactionData.payment_inst_sub_type = statusresponse.paymentSubInstType;
                                    }
                                    if ("NB" === statusresponse.paymentMode) {
                                        context.paymentTransactionData.payment_inst_type = "NB";
                                        context.paymentTransactionData.payment_inst_sub_type = statusresponse.paymentSubInstType;
                                    }
                                    if ("UPI" === statusresponse.paymentMode) {
                                        context.paymentTransactionData.masked_payment_inst_id = statusresponse.field1;
                                        context.paymentTransactionData.payment_inst_type = "UPI";
                                    }
                                } else if ("REJ" === statusresponse.txnStatus) {
                                    context.paymentTransactionData.auth_no = statusresponse.txnID;
                                    context.paymentTransactionData.auth_id = statusresponse.txnAuthID;
                                    context.paymentTransactionData.acq_resp_date_time = moment(statusresponse.paymentDateTime, 'YYYYMMDDHHmmss').toDate();
                                    context.paymentTransactionData.acquirer_response_code = statusresponse.txnResponseCode;

                                    context.paymentTransactionData.response_code = "39";
                                    context.paymentTransactionData.payment_status = "FAI";
                                    context.paymentTransactionData.response_desc = statusresponse.txnRespDescription;

                                    context.paymentTransactionData.str_fld_1 = "STATUS_CHECK";
                                    context.paymentTransactionData.str_fld_4 = body;
                                    context.paymentTransactionData.payment_inst_type = statusresponse.paymentMode;

                                    if ("Card" === statusresponse.paymentMode) {
                                        context.paymentTransactionData.masked_payment_inst_id = statusresponse.card_no;
                                        context.paymentTransactionData.card_network = statusresponse.card_type;
                                        context.paymentTransactionData.payment_inst_type = "CARD";
                                        context.paymentTransactionData.payment_inst_sub_type = statusresponse.paymentSubInstType;
                                    }
                                    if ("NB" === statusresponse.paymentMode) {
                                        context.paymentTransactionData.payment_inst_type = "NB";
                                        context.paymentTransactionData.payment_inst_sub_type = statusresponse.paymentSubInstType;
                                    }
                                    if ("UPI" === statusresponse.paymentMode) {
                                        context.paymentTransactionData.masked_payment_inst_id = statusresponse.field1;
                                        context.paymentTransactionData.payment_inst_type = "UPI";
                                    }
                                }
                            } catch (error) {
                                logger.error("Exception--------", error.stack, error);
                                logger.error(error);
                                logger.error("Exception--------");
                            }

                            resolve([false, context]);
                        } else {
                            resolve([true, { "errormsg": "Invalid Order" }]);
                        }
                    } else {
                        resolve([true, { "errormsg": "Invalid Order" }]);
                    }
                });
        });

        return promise;

    }

}
module.exports = PayPhiPaymentGatewayService;