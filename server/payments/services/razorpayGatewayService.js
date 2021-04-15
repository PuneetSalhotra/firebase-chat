"use strict";

const Razorpay = require("razorpay");
const logger = require('../../logger/winstonLogger');
const uuidv4 = require('uuid/v4');
function RazorPaymentGatewayService(objCollection) {

    this.createOrder = async function (request, merchantData) {
        logger.info("RazorPaymentGatewayService : createOrder: merchant_id = " + request.merchant_id +
        " merchant_txn_ref_no = " + request.merchant_txn_ref_no);
        let error = false;

        //merchant key
        //need to take it from merchant_acquirer_param
        let instance = new Razorpay ({ key_id: global.config.razorpayApiId, key_secret: global.config.razorpayApiKey })

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
                    logger.info("merchant_id = " + request.merchant_id + " merchant_txn_ref_no = " + request.merchant_txn_ref_no + " : razorpay create order response : " + JSON.stringify(order));
                    logger.info("RazorPaymentGatewayService : createOrder: response : " + JSON.stringify(options));
                    resolve([false, options]);
                }
            });
        });

        return promise;
        
    }

    this.fetchOrder = async function (razorpay_order_id, paymentLogData) {
        logger.info("RazorPaymentGatewayService : fetchOrder: order_id = " + razorpay_order_id);
        
        let responseData = [],
            error = false;

        //merchant key
        //need to take it from merchant_acquirer_param
        let instance = new Razorpay ({ key_id: global.config.razorpayApiId, key_secret: global.config.razorpayApiKey })

        let promise = new Promise ((resolve, reject) => {

            //create order call
            instance.orders.fetch (razorpay_order_id, (err, order) => {
                
                if(err) {
                    logger.error("RazorPaymentGatewayService : fetchOrder: order_id = " + razorpay_order_id + " : Error :");
                    logger.error(err);
                    reject([true, {"message" : err}]);
                } else {
                    logger.info("RazorPaymentGatewayService : fetchOrder: order_id = " + razorpay_order_id + " : response :" + JSON.stringify(order));
                    resolve([false, order]);
                }

            });

        });

        return promise;
        
    }

    this.fetchPaymentsByUsingOrderId = async function (razorpay_order_id) {
        logger.info("RazorPaymentGatewayService : fetchPaymentsByUsingOrderId: razorpay_order_id = " + razorpay_order_id);
        
        let responseData = [],
            error = false;

        //merchant key
        //need to take it from merchant_acquirer_param
        let instance = new Razorpay ({ key_id: global.config.razorpayApiId, key_secret: global.config.razorpayApiKey })

        let promise = new Promise ((resolve, reject) => {

            //fetch payments list
            instance.orders.fetchPayments (razorpay_order_id, (err, payments) => {
                
                if(err) {
                    logger.error("RazorPaymentGatewayService : fetchPaymentsByUsingOrderId: order_id = " + razorpay_order_id + " : Error :");
                    logger.error(err);
                    reject([true, {"message" : err}]);
                } else {
                    logger.info("RazorPaymentGatewayService : fetchPaymentsByUsingOrderId: order_id = " + razorpay_order_id + " : response :" + JSON.stringify(payments));
                    if(payments.count == 0) {
                        resolve([false, {}]);    
                    } else {
                        payments = payments.items[0];
                        resolve([false, payments]);
                    }
                }
            });

        });

        return promise;
        
    }

    this.fetchPaymentByUsingPaymentId = async function (razorpay_payment_id) {
        logger.info("RazorPaymentGatewayService : fetchPaymentByUsingPaymentId: razorpay_payment_id = " + razorpay_payment_id);
        
        let responseData = [],
            error = false;

        //merchant key
        //need to take it from merchant_acquirer_param
        let instance = new Razorpay ({ key_id: global.config.razorpayApiId, key_secret: global.config.razorpayApiKey })

        let promise = new Promise ((resolve, reject) => {

            //create order call
            instance.payments.fetch (razorpay_payment_id, (err, payment) => {

                if(err) {
                    logger.error("RazorPaymentGatewayService : fetchPaymentByUsingPaymentId: razorpay_payment_id = " + razorpay_payment_id + " : Error :");
                    logger.error(err);
                    reject([true, {"message" : err}]);
                } else {
                    logger.info("RazorPaymentGatewayService : fetchPaymentByUsingPaymentId: razorpay_payment_id = " + razorpay_payment_id + " : response :" + JSON.stringify(payment));
                    resolve([false, payment]);
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