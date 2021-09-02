"use strict";

const Razorpay = require("razorpay");
const logger = require('../../logger/winstonLogger');
const uuidv4 = require('uuid/v4');
const PaymentUtil = require('../utils/paymentUtil');
const moment = require('moment');
function RazorPaymentGatewayService(objCollection) {

    const paymentUtil = new PaymentUtil(objCollection);

    this.createOrder = async function (request, context) {
        let merchantData = context.merchantData;
        logger.info("RazorPaymentGatewayService : createOrder: merchant_id = " + request.merchant_id +
        " merchant_txn_ref_no = " + request.merchant_txn_ref_no);
        let error = false;

        //merchant key
        //need to take it from merchant_acquirer_param
        let key_id_var = global.config.razorpayApiId;
        let key_secret_var = global.config.razorpayApiKey;

        //key_id_var = context.merchantParamData.param_1;
        //key_secret_var = context.merchantParamData.param_2;

        let instance = new Razorpay({ key_id: key_id_var, key_secret: key_secret_var })


        let options = {
            amount: Number(request.amount).toFixed(2) * 100,  // amount in the smallest currency unit
            currency: request.currency,
            receipt: request.merchant_txn_ref_no
        };

        let promise = new Promise ((resolve, reject) => {

            logger.info("merchant_id = " + request.merchant_id + " merchant_txn_ref_no = " + request.merchant_txn_ref_no + " : razorpay create order request parameters : " + JSON.stringify(options));
            //create order call
            instance.orders.create (options, (err, order) => {
                
                if(err) {
                    logger.error("merchant_id = " + request.merchant_id + " merchant_txn_ref_no = " + request.merchant_txn_ref_no + " : razorpay create order response error : ", err);
                    reject([true, {"message" : err}]);
                } else {
                    let options = {
                        "key": global.config.razorpayApiId, // Enter the Key ID generated from the Dashboard
                        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                        "currency": order.currency,
                        "name": merchantData.merchant_name,
                        "description": request.description,
                        "image": "https://example.com/your_logo",
                        "order_id": order.id,
                        "prefill": {
                            "contact": request.customer_mobile_no
                        }
                    };
                    context.paymentTransactionData.auth_no = order.id;
                    context.options = options;
                    logger.info("merchant_id = " + request.merchant_id + " merchant_txn_ref_no = " + request.merchant_txn_ref_no + " : razorpay create order response : " + JSON.stringify(order));
                    logger.info("RazorPaymentGatewayService : createOrder: response : " + JSON.stringify(options));
                    resolve([false, context]);
                }
            });
        });

        return promise;
        
    }

    // this.fetchOrder = async function (razorpay_order_id, paymentLogData) {
    //     logger.info("RazorPaymentGatewayService : fetchOrder: order_id = " + razorpay_order_id);
        
    //     let responseData = [],
    //         error = false;

    //     //merchant key
    //     //need to take it from merchant_acquirer_param
    //     let instance = new Razorpay ({ key_id: global.config.razorpayApiId, key_secret: global.config.razorpayApiKey })

    //     let promise = new Promise ((resolve, reject) => {

    //         //create order call
    //         instance.orders.fetch (razorpay_order_id, (err, order) => {
                
    //             if(err) {
    //                 logger.error("RazorPaymentGatewayService : fetchOrder: order_id = " + razorpay_order_id + " : Error :");
    //                 logger.error(err);
    //                 reject([true, {"message" : err}]);
    //             } else {
    //                 logger.info("RazorPaymentGatewayService : fetchOrder: order_id = " + razorpay_order_id + " : response :" + JSON.stringify(order));
    //                 resolve([false, order]);
    //             }

    //         });

    //     });

    //     return promise;
        
    // }

    this.fetchPaymentsByUsingOrderId = async function (context) {
        let razorpay_order_id = context.paymentTransactionData.auth_no;
        logger.info("RazorPaymentGatewayService : fetchPaymentsByUsingOrderId: razorpay_order_id = " + razorpay_order_id);
        
        let responseData = [],
            error = false;

        //merchant key
        //need to take it from merchant_acquirer_param
        let key_id_var = global.config.razorpayApiId;
        let key_secret_var = global.config.razorpayApiKey;

        //key_id_var = context.merchantParamData.param_1;
        //key_secret_var = context.merchantParamData.param_2;

        let instance = new Razorpay({ key_id: key_id_var, key_secret: key_secret_var })

        let promise = new Promise ((resolve, reject) => {

            //fetch payments list
            instance.orders.fetchPayments(razorpay_order_id, (err, payments) => {
                
                if(err) {
                    logger.error("RazorPaymentGatewayService : fetchPaymentsByUsingOrderId: order_id = " + razorpay_order_id + " : Error :");
                    logger.error(err);
                    resolve([true, { "message": err }]);
                } else {
                    logger.info("RazorPaymentGatewayService : fetchPaymentsByUsingOrderId: order_id = " + razorpay_order_id + " : response :" + JSON.stringify(payments));
                    if(payments.count == 0) {
                        resolve([false, context]);
                    } else {
                        payments = payments.items[0];

                        if (payments.id === undefined || (razorpay_order_id !== payments.order_id)) {
                            resolve([false, context]);
                        }

                        context.paymentTransactionData.acquirer_response_code = "39";
                        context.paymentTransactionData.response_code = "39";
                        context.paymentTransactionData.payment_status = "FAI";
                        context.paymentTransactionData.response_desc = "FAILED";
                        context.paymentTransactionData.str_fld_1 = "STATUS_CHECK";
                        context.paymentTransactionData.str_fld_4 = JSON.stringify(payments);
                        context.paymentTransactionData.auth_id = payments.id;
                        context.paymentTransactionData.payment_inst_type = payments.method;
                        let response_date_time = payments.created_at;
                        if (response_date_time === null || response_date_time === "0000-00-00 00:00:00") {
                            response_date_time = new Date();
                        }
                        context.paymentTransactionData.acq_resp_date_time = moment(response_date_time).utc().format("YYYY-MM-DD HH:mm:ss");

                        if ("captured" == payments.status) {
                            context.paymentTransactionData.acquirer_response_code = "00";
                            context.paymentTransactionData.response_code = "00";
                            context.paymentTransactionData.payment_status = "SUC";
                            context.paymentTransactionData.response_desc = "Transaction Successfull";
                        }
                        if ("card" === payments.method) {
                            context.paymentTransactionData.encrypted_payment_inst_id = payments.card_id;
                        }
                        if ("netbanking" === payments.method) {
                            context.paymentTransactionData.payment_inst_sub_type = payments.bank;
                        }
                        if ("upi" === payments.method) {
                            context.paymentTransactionData.payment_inst_sub_type = payments.vpa;
                        }
                        if ("wallet" === payments.method) {
                            context.paymentTransactionData.payment_inst_sub_type = payments.wallet;
                        }
                        if (payments.hasOwnProperty("acquirer_data")) {
                            if (paymentUtil.isNumber(payments.acquirer_data.auth_code)) {
                                context.paymentTransactionData.str_fld_2 = payments.acquirer_data.auth_code;
                            }
                            if (paymentUtil.isNumber(payments.acquirer_data.bank_transaction_id)) {
                                context.paymentTransactionData.str_fld_2 = payments.acquirer_data.bank_transaction_id;
                            }
                            if (paymentUtil.isNumber(payments.acquirer_data.transaction_id)) {
                                context.paymentTransactionData.str_fld_2 = payments.acquirer_data.transaction_id;
                            }
                            if (paymentUtil.isNumber(payments.acquirer_data.bank_transaction_id)) {
                                context.paymentTransactionData.str_fld_2 = payments.acquirer_data.bank_transaction_id;
                            }
                            if (paymentUtil.isNumber(payments.acquirer_data.rrn)) {
                                context.paymentTransactionData.str_fld_2 = payments.acquirer_data.rrn;
                            }
                        }
                        resolve([false, context]);
                    }
                }
            });

        });

        return promise;
        
    }

    this.fetchPaymentByUsingPaymentId = async function (context) {
        let razorpay_payment_id = context.paymentTransactionData.auth_id;
        logger.info("RazorPaymentGatewayService : fetchPaymentByUsingPaymentId: razorpay_payment_id = " + razorpay_payment_id);
        
        let responseData = [],
            error = false;

        //merchant key
        //need to take it from merchant_acquirer_param
        let key_id_var = global.config.razorpayApiId;
        let key_secret_var = global.config.razorpayApiKey;

        //key_id_var = context.merchantParamData.param_1;
        //key_secret_var = context.merchantParamData.param_2;

        let instance = new Razorpay({ key_id: key_id_var, key_secret: key_secret_var })

        let promise = new Promise ((resolve, reject) => {

            //create order call
            instance.payments.fetch(razorpay_payment_id, (err, payments) => {

                if(err) {
                    logger.error("RazorPaymentGatewayService : fetchPaymentByUsingPaymentId: razorpay_payment_id = " + razorpay_payment_id + " : Error :");
                    logger.error(err);
                    reject([true, {"message" : err}]);
                } else {
                    logger.info("RazorPaymentGatewayService : fetchPaymentByUsingPaymentId: razorpay_payment_id = " + razorpay_payment_id + " : response :" + JSON.stringify(payments));
                    if (payments.id === undefined || (context.paymentTransactionData.auth_no !== payments.order_id)) {
                        resolve([false, context]);
                    }

                    context.paymentTransactionData.acquirer_response_code = "39";
                    context.paymentTransactionData.response_code = "39";
                    context.paymentTransactionData.payment_status = "FAI";
                    context.paymentTransactionData.response_desc = "FAILED";
                    context.paymentTransactionData.str_fld_1 = "WEBHOOK";
                    context.paymentTransactionData.str_fld_4 = JSON.stringify(payments);
                    context.paymentTransactionData.auth_id = payments.id;
                    context.paymentTransactionData.payment_inst_type = payments.method;
                    let response_date_time = payments.created_at;
                    if (response_date_time === null || response_date_time === "0000-00-00 00:00:00") {
                        response_date_time = new Date();
                    }
                    context.paymentTransactionData.acq_resp_date_time = moment(response_date_time).utc().format("YYYY-MM-DD HH:mm:ss");

                    if ("captured" == payments.status) {
                        context.paymentTransactionData.acquirer_response_code = "00";
                        context.paymentTransactionData.response_code = "00";
                        context.paymentTransactionData.payment_status = "SUC";
                        context.paymentTransactionData.response_desc = "Transaction Successfull";
                    }
                    if ("card" === payments.method) {
                        context.paymentTransactionData.encrypted_payment_inst_id = payments.card_id;
                    }
                    if ("netbanking" === payments.method) {
                        context.paymentTransactionData.payment_inst_sub_type = payments.bank;
                    }
                    if ("upi" === payments.method) {
                        context.paymentTransactionData.payment_inst_sub_type = payments.vpa;
                    }
                    if ("wallet" === payments.method) {
                        context.paymentTransactionData.payment_inst_sub_type = payments.wallet;
                    }
                    if (payments.hasOwnProperty("acquirer_data")) {
                        if (paymentUtil.isNumber(payments.acquirer_data.auth_code)) {
                            context.paymentTransactionData.str_fld_2 = payments.acquirer_data.auth_code;
                        }
                        if (paymentUtil.isNumber(payments.acquirer_data.bank_transaction_id)) {
                            context.paymentTransactionData.str_fld_2 = payments.acquirer_data.bank_transaction_id;
                        }
                        if (paymentUtil.isNumber(payments.acquirer_data.transaction_id)) {
                            context.paymentTransactionData.str_fld_2 = payments.acquirer_data.transaction_id;
                        }
                        if (paymentUtil.isNumber(payments.acquirer_data.bank_transaction_id)) {
                            context.paymentTransactionData.str_fld_2 = payments.acquirer_data.bank_transaction_id;
                        }
                        if (paymentUtil.isNumber(payments.acquirer_data.rrn)) {
                            context.paymentTransactionData.str_fld_2 = payments.acquirer_data.rrn;
                        }
                    }
                    resolve([false, context]);
                }

            });
            
        });

        return promise;
        
    }

    this.fetchRefundByUsingRefundId = async function(razorpay_payment_id, razorpay_refund_id) {
        
        logger.info("RazorPaymentGatewayService : fetchRefundByUsingRefundId: razorpay_refund_id = " + razorpay_refund_id);
        
        let responseData = [],
            error = false;

        //merchant key
        //need to take it from merchant_acquirer_param
        let instance = new Razorpay ({ key_id: global.config.razorpayApiId, key_secret: global.config.razorpayApiKey })

        let promise = new Promise ((resolve, reject) => {

            //create order call
            instance.refunds.fetch (razorpay_refund_id, { payment_id : razorpay_payment_id }, (err, refund) => {

                if(err) {
                    logger.error("RazorPaymentGatewayService : fetchRefundByUsingRefundId: razorpay_refund_id = " + razorpay_refund_id + " : Error :");
                    logger.error(err);
                    reject([true, {"message" : err}]);
                } else {
                    logger.info("RazorPaymentGatewayService : fetchRefundByUsingRefundId: razorpay_refund_id = " + razorpay_refund_id + " : response :" + JSON.stringify(refund));
                    resolve([false, refund]);
                }

            });
            
        });

        return promise;
    }

    this.createRefund = async function(razorpay_payment_id, jsonObj) {
        
        logger.info("RazorPaymentGatewayService : createRefund: razorpay_payment_id = " + razorpay_payment_id);
        logger.info(jsonObj);
        let responseData = [],
            error = false;

        //merchant key
        //need to take it from merchant_acquirer_param
        let instance = new Razorpay ({ key_id: global.config.razorpayApiId, key_secret: global.config.razorpayApiKey })

        let promise = new Promise ((resolve, reject) => {

            //create refund call
            instance.payments.refund (razorpay_payment_id, jsonObj, (err, refund) => {

                if(err) {
                    logger.error("RazorPaymentGatewayService : createRefund: razorpay_payment_id = " + razorpay_payment_id + " : Error :");
                    logger.error(err);
                    reject([true, {"message" : err}]);
                } else {
                    logger.info("RazorPaymentGatewayService : createRefund: razorpay_payment_id = " + razorpay_payment_id + " : response :" + JSON.stringify(refund));
                    resolve([false, refund]);
                }

            });
            
        });

        return promise;
    }
}
module.exports = RazorPaymentGatewayService;