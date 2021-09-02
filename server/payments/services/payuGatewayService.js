"use strict";

const Razorpay = require("razorpay");
const logger = require('../../logger/winstonLogger');
const uuidv4 = require('uuid/v4');
const PaymentUtil = require('../utils/paymentUtil');
const requestServer = require("request");
const moment = require('moment');
function PayUPaymentGatewayService(objCollection) {

    const paymentUtil = new PaymentUtil(objCollection);

    this.verifyResponseHash = function (request, context) {
        logger.debug("verifyResponseHash=>")
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
        let requestHash = request.hash;
        let hashtext = salt + "|" + status + "||||||" + udf5 + "|" + udf4 + "|" + udf3 + "|" + udf2 + "|" + udf1 + "|" + email + "|" + firstname + "|" + productinfo + "|" + amount + "|" + txnid + "|" + key;
        logger.debug("hashtext = " + hashtext);
        let hash = paymentUtil.sha512InHEX(hashtext);

        logger.debug("requested hash = " + requestHash);
        logger.debug("generated hash = " + hash);
        if (requestHash === hash && isValidKey) {
            return true;
        } else {
            return false;
        }
    }

    this.createOrder = async function (request, context) {
        logger.info("PayUPaymentGatewayService : createOrder: merchant_id = " + request.merchant_id +
            " merchant_txn_ref_no = " + request.merchant_txn_ref_no);

        let promise = new Promise((resolve, reject) => {

            let key = context.merchantParamData.param_1;
            let salt = context.merchantParamData.param_2;

            let paymenturl = context.gatewayData.gateway_host_name + "/" + context.gatewayData.gateway_param_1;

            let txnid = request.merchant_txn_ref_no;
            let amount = Number(request.amount).toFixed(2);
            let productinfo = request.description || " ";
            let firstname = request.firstname || "dummy";
            let email = "payments@grenerobotics.com";
            let phone = request.customer_mobile_no;

            //Need to change.
            let paymentresponseurl = context.gatewayData.param_1;
            //paymentresponseurl = "http://localhost:7000/r1/pam/payment/response";
            let surl = paymentresponseurl;
            let furl = paymentresponseurl;

            let udf1 = request.merchant_id;
            let udf2 = "PayU";
            let udf3 = "";
            let udf4 = "";
            let udf5 = "";


            let hashtext = key + "|" + txnid + "|" + amount + "|" + productinfo + "|" + firstname + "|" + email + "|"
                + udf1 + "|" + udf2 + "|" + udf3 + "|" + udf4 + "|" + udf5 + "||||||" + salt;
            logger.debug("hashtext = " + hashtext);
            let hash = paymentUtil.sha512InHEX(hashtext);
            logger.debug("hash = " + hash);

            let options = {
                actionUrl: paymenturl,
                key: key,
                hash: hash,
                udf1: udf1,
                udf2: udf2,
                udf3: udf3,
                udf4: udf4,
                udf5: udf5,
                txnid: txnid,
                amount: amount,
                productinfo: productinfo,
                firstname: firstname,
                email: email,
                phone: phone,
                surl: surl,
                furl: furl
            };
            context.options = options;
            context.paymentTransactionData.auth_no = null;
            logger.info("merchant_id = " + request.merchant_id + " merchant_txn_ref_no = " + request.merchant_txn_ref_no);
            logger.info("PayUPaymentGatewayService : createOrder: response : " + JSON.stringify(options));
            resolve([false, context]);

        });

        return promise;

    }

    this.fetchPaymentsByUsingOrderId = async function (request, context) {
        logger.info("PayUPaymentGatewayService : fetchPaymentsByUsingOrderId: merchant_txn_ref_no = " + context.paymentTransactionData.merchant_txn_ref_no);
        let promise = new Promise((resolve, reject) => {
            let txnid = context.paymentTransactionData.merchant_txn_ref_no;
            let key = context.merchantParamData.param_1;
            let salt = context.merchantParamData.param_2;

            let command = "verify_payment";

            let hashtext = key + "|" + command + "|" + txnid + "|" + salt;
            logger.debug("hashtext = " + hashtext);
            let hash = paymentUtil.sha512InHEX(hashtext);
            logger.debug("hash = " + hash);

            let queryString = "key=" + key + "&command=" + command + "&var1=" + txnid + "&hash=" + hash;
            logger.debug("queryString = " + queryString);

            let postserviceurl = context.gatewayData.gateway_host_name + "/" + context.gatewayData.gateway_param_2;

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
                                let jsonbody = JSON.parse(body);
                                if (jsonbody.status == 1 && jsonbody.transaction_details !== {}) {
                                    if (jsonbody.transaction_details[txnid] !== {}) {
                                        let statusresponse = jsonbody.transaction_details[txnid];
                                        if (statusresponse === {}) {
                                            logger.error('Invaild parameter `txnid`');
                                            resolve([true, {
                                                errormsg: 'Invaild parameter `txnid`'
                                            }]);
                                        } else {
                                            if (context.paymentTransactionData.merchant_txn_ref_no !== statusresponse.txnid) {
                                                logger.error('Invaild parameter `txnid`');
                                                resolve([true, {
                                                    errormsg: 'Invaild parameter `txnid`'
                                                }]);
                                            } else {
                                                try {
                                                    if ("success" == statusresponse.status && "captured" == statusresponse.unmappedstatus) {
                                                        let response_date_time = statusresponse.Settled_At;
                                                        if (response_date_time === null || response_date_time === "0000-00-00 00:00:00") {
                                                            response_date_time = new Date();
                                                        }
                                                        context.paymentTransactionData.auth_no = statusresponse.mihpayid;
                                                        context.paymentTransactionData.auth_id = statusresponse.bank_ref_num;
                                                        context.paymentTransactionData.acq_resp_date_time = moment(response_date_time).utc().format("YYYY-MM-DD HH:mm:ss");
                                                        if (statusresponse.error_code !== undefined && statusresponse.error_code !== null) {
                                                            context.paymentTransactionData.acquirer_response_code = statusresponse.error_code;
                                                        } else {
                                                            context.paymentTransactionData.acquirer_response_code = "00";
                                                        }
                                                        context.paymentTransactionData.response_code = "00";
                                                        context.paymentTransactionData.payment_status = "SUC";
                                                        if (statusresponse.field9 !== undefined && statusresponse.field9 !== null) {
                                                            context.paymentTransactionData.response_desc = statusresponse.field9;
                                                            if ("No Error" === statusresponse.field9) {
                                                                context.paymentTransactionData.response_desc = "Transaction Successful";
                                                            }
                                                        } else {
                                                            context.paymentTransactionData.response_desc = "Transaction Successful";
                                                        }
                                                        context.paymentTransactionData.str_fld_2 = statusresponse.field2;
                                                        context.paymentTransactionData.str_fld_1 = "STATUS_CHECK";
                                                        context.paymentTransactionData.str_fld_4 = body;
                                                        context.paymentTransactionData.payment_inst_type = statusresponse.mode;
                                                        if ("CC" === statusresponse.mode || "DC" === statusresponse.mode) {
                                                            context.paymentTransactionData.masked_payment_inst_id = statusresponse.card_no;
                                                            context.paymentTransactionData.card_network = statusresponse.card_type;
                                                            context.paymentTransactionData.payment_inst_type = "CARD";
                                                            context.paymentTransactionData.payment_inst_sub_type = statusresponse.mode;
                                                        }
                                                        if ("NB" === statusresponse.mode) {
                                                            context.paymentTransactionData.payment_inst_type = "NB";
                                                            context.paymentTransactionData.payment_inst_sub_type = statusresponse.bankcode;
                                                        }
                                                        if ("UPI" === statusresponse.mode) {
                                                            context.paymentTransactionData.masked_payment_inst_id = statusresponse.field1;
                                                            context.paymentTransactionData.payment_inst_type = "UPI";
                                                        }
                                                    } else if ("failure" === statusresponse.status) {
                                                        let response_date_time = statusresponse.Settled_At;
                                                        if (response_date_time === null || response_date_time === "0000-00-00 00:00:00") {
                                                            response_date_time = new Date();
                                                        }
                                                        context.paymentTransactionData.auth_no = statusresponse.mihpayid;
                                                        context.paymentTransactionData.auth_id = statusresponse.bank_ref_num;
                                                        context.paymentTransactionData.acq_resp_date_time = moment(response_date_time).utc().format("YYYY-MM-DD HH:mm:ss");
                                                        if (statusresponse.error_code !== undefined && statusresponse.error_code !== null) {
                                                            context.paymentTransactionData.acquirer_response_code = statusresponse.error_code;
                                                        } else {
                                                            context.paymentTransactionData.acquirer_response_code = "39";
                                                        }
                                                        context.paymentTransactionData.response_code = "39";
                                                        context.paymentTransactionData.payment_status = "FAI";
                                                        if (statusresponse.field9 !== undefined && statusresponse.field9 !== null) {
                                                            context.paymentTransactionData.response_desc = statusresponse.field9;
                                                        } else {
                                                            context.paymentTransactionData.response_desc = "Transaction Failed";
                                                        }
                                                        context.paymentTransactionData.str_fld_2 = statusresponse.field2;
                                                        context.paymentTransactionData.str_fld_1 = "STATUS_CHECK";
                                                        context.paymentTransactionData.str_fld_4 = body;
                                                        context.paymentTransactionData.payment_inst_type = statusresponse.mode;
                                                        if ("CC" === statusresponse.mode || "DC" === statusresponse.mode) {
                                                            context.paymentTransactionData.masked_payment_inst_id = statusresponse.card_no;
                                                            context.paymentTransactionData.card_network = statusresponse.card_type;
                                                            context.paymentTransactionData.payment_inst_type = "CARD";
                                                            context.paymentTransactionData.payment_inst_sub_type = statusresponse.mode;
                                                        }
                                                        if ("NB" === statusresponse.mode) {
                                                            context.paymentTransactionData.payment_inst_type = "NB";
                                                            context.paymentTransactionData.payment_inst_sub_type = statusresponse.bankcode;
                                                        }
                                                        if ("UPI" === statusresponse.mode) {
                                                            context.paymentTransactionData.masked_payment_inst_id = statusresponse.field1;
                                                            context.paymentTransactionData.payment_inst_type = "UPI";
                                                        }
                                                    }
                                                } catch (error) {
                                                    logger.error("kladj;dsajdskljadflkdsfj;lasjdf");
                                                    logger.error(error);
                                                    logger.error("kladj;dsajdskljadflkdsfj;lasjdf");
                                                }
                                                resolve([false, context]);
                                            }
                                        }
                                    } else {
                                        resolve([false, context]);
                                    }
                                } else {
                                    resolve([false, context]);//need to change
                                }
                            } catch (error) {
                                logger.error("kladj;dsajdskljadflkdsfj;lasjdf");
                                logger.error(error);
                                logger.error("kladj;dsajdskljadflkdsfj;lasjdf");
                                resolve([false, context]);//need to change
                            }
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

        logger.info("PayUPaymentGatewayService : fetchPaymentByUsingPaymentId: payu_payment_id = " + payu_payment_id);

        let promise = new Promise((resolve, reject) => {
            let txnid = context.paymentTransactionData.merchant_txn_ref_no;
            let payu_payment_id = context.paymentTransactionData.auth_no;
            let key = context.merchantParamData.param_1;
            let salt = context.merchantParamData.param_2;

            let command = "check_payment";

            let hashtext = key + "|" + command + "|" + payu_payment_id + "|" + salt;
            logger.debug("hashtext = " + hashtext);
            let hash = paymentUtil.sha512InHEX(hashtext);
            logger.debug("hash = " + hash);

            let queryString = "key=" + key + "&command=" + command + "&var1=" + payu_payment_id + "&hash=" + hash;
            logger.debug("queryString = " + queryString);

            let postserviceurl = context.gatewayData.gateway_host_name + "/" + context.gatewayData.gateway_param_2;

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
                                let jsonbody = JSON.parse(body);
                                if (jsonbody.status == 1 && jsonbody.transaction_details !== {}) {
                                    let statusresponse = jsonbody.transaction_details;
                                    if (context.paymentTransactionData.merchant_txn_ref_no !== statusresponse.txnid) {
                                        logger.error('Invaild parameter `txnid`');
                                        resolve([true, {
                                            errormsg: 'Invaild parameter `txnid`'
                                        }]);
                                    } else {
                                        try {
                                            if ("success" == statusresponse.status && "captured" == statusresponse.unmappedstatus) {
                                                let response_date_time = statusresponse.Settled_At;
                                                if (response_date_time === null || response_date_time === "0000-00-00 00:00:00") {
                                                    response_date_time = new Date();
                                                }
                                                context.paymentTransactionData.auth_no = statusresponse.mihpayid;
                                                context.paymentTransactionData.auth_id = statusresponse.bank_ref_num;
                                                context.paymentTransactionData.acq_resp_date_time = moment(response_date_time).utc().format("YYYY-MM-DD HH:mm:ss");
                                                if (request.error !== undefined && request.error !== null) {
                                                    context.paymentTransactionData.acquirer_response_code = request.error;
                                                } else {
                                                    context.paymentTransactionData.acquirer_response_code = statusresponse.field6;
                                                }
                                                context.paymentTransactionData.response_code = "00";
                                                context.paymentTransactionData.payment_status = "SUC";
                                                if (statusresponse.field9 !== undefined && statusresponse.field9 !== null) {
                                                    context.paymentTransactionData.response_desc = statusresponse.field9;
                                                    if ("No Error" === statusresponse.field9) {
                                                        context.paymentTransactionData.response_desc = "Transaction Successful";
                                                    }
                                                } else {
                                                    context.paymentTransactionData.response_desc = "Transaction Successful";
                                                }
                                                context.paymentTransactionData.str_fld_2 = statusresponse.field2;
                                                context.paymentTransactionData.str_fld_1 = "WEB_HOOK";
                                                context.paymentTransactionData.str_fld_4 = body;
                                                context.paymentTransactionData.payment_inst_type = statusresponse.mode;
                                                if ("CC" === statusresponse.mode || "DC" === statusresponse.mode) {
                                                    context.paymentTransactionData.masked_payment_inst_id = statusresponse.card_no;
                                                    context.paymentTransactionData.card_network = statusresponse.card_type;
                                                    context.paymentTransactionData.payment_inst_type = "CARD";
                                                    context.paymentTransactionData.payment_inst_sub_type = statusresponse.mode;
                                                }
                                                if ("NB" === statusresponse.mode) {
                                                    context.paymentTransactionData.payment_inst_type = "NB";
                                                    context.paymentTransactionData.payment_inst_sub_type = statusresponse.bankcode;
                                                }
                                                if ("UPI" === statusresponse.mode) {
                                                    context.paymentTransactionData.masked_payment_inst_id = statusresponse.field1;
                                                    context.paymentTransactionData.payment_inst_type = "UPI";
                                                }
                                            } else if ("failure" === statusresponse.status) {
                                                let response_date_time = statusresponse.Settled_At;
                                                if (response_date_time === null || response_date_time === "0000-00-00 00:00:00") {
                                                    response_date_time = new Date();
                                                }
                                                context.paymentTransactionData.auth_no = statusresponse.mihpayid;
                                                context.paymentTransactionData.auth_id = statusresponse.bank_ref_num;
                                                context.paymentTransactionData.acq_resp_date_time = moment(response_date_time).utc().format("YYYY-MM-DD HH:mm:ss");
                                                if (request.error !== undefined && request.error !== null) {
                                                    context.paymentTransactionData.acquirer_response_code = request.error;
                                                } else {
                                                    context.paymentTransactionData.acquirer_response_code = statusresponse.field6;
                                                }
                                                context.paymentTransactionData.response_code = "39";
                                                context.paymentTransactionData.payment_status = "FAI";
                                                if (statusresponse.field9 !== undefined && statusresponse.field9 !== null) {
                                                    context.paymentTransactionData.response_desc = statusresponse.field9;
                                                } else {
                                                    context.paymentTransactionData.response_desc = "Transaction Failed";
                                                }
                                                context.paymentTransactionData.str_fld_2 = statusresponse.field2;
                                                context.paymentTransactionData.str_fld_1 = "WEB_HOOK";
                                                context.paymentTransactionData.str_fld_4 = body;
                                                context.paymentTransactionData.payment_inst_type = statusresponse.mode;
                                                if ("CC" === statusresponse.mode || "DC" === statusresponse.mode) {
                                                    context.paymentTransactionData.masked_payment_inst_id = statusresponse.card_no;
                                                    context.paymentTransactionData.card_network = statusresponse.card_type;
                                                    context.paymentTransactionData.payment_inst_type = "CARD";
                                                    context.paymentTransactionData.payment_inst_sub_type = statusresponse.mode;
                                                }
                                                if ("NB" === statusresponse.mode) {
                                                    context.paymentTransactionData.payment_inst_type = "NB";
                                                    context.paymentTransactionData.payment_inst_sub_type = statusresponse.bankcode;
                                                }
                                                if ("UPI" === statusresponse.mode) {
                                                    context.paymentTransactionData.masked_payment_inst_id = statusresponse.field1;
                                                    context.paymentTransactionData.payment_inst_type = "UPI";
                                                }
                                            }
                                        } catch (error) {
                                            logger.error("Exception--------");
                                            logger.error(error);
                                            logger.error("Exception--------");
                                        }
                                        resolve([false, context]);
                                    }
                                } else {
                                    resolve([false, context]);//need to change
                                }
                            } catch (error) {
                                logger.error("Exception--------");
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
module.exports = PayUPaymentGatewayService;