"use strict";

const Razorpay = require("razorpay");
const logger = require('../../logger/winstonLogger');
const uuidv4 = require('uuid/v4');
function RazorPaymentGatewayService(objCollection) {

    this.createOrder = async function (requestData, merchantData) {
        logger.info("RazorPaymentGatewayService : createOrder: request :" + JSON.stringify(requestData));
        
        let error = false;

        //merchant key
        //need to take it from merchant_acquirer_param
        let instance = new Razorpay ({ key_id: global.config.razorpayApiId, key_secret: global.config.razorpayApiKey })

        let options = {
            amount: Number(requestData.amount).toFixed(2) * 100,  // amount in the smallest currency unit
            currency: requestData.currency,
            receipt: requestData.merchant_txn_ref_no
        };

        let promise = new Promise ((resolve, reject) => {

            //create order call
            instance.orders.create (options, (err, order) => {
                
                if(err) {
                    logger.error("razorpay payment gateway response error =");
                    logger.error(err);
                    reject([true, {"message" : err}]);
                } else {
                    let options = {
                        "key": global.config.razorpayApiId, // Enter the Key ID generated from the Dashboard
                        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                        "currency": order.currency,
                        "name": merchantData.merchant_name,
                        "description": requestData.description,
                        "image": "https://example.com/your_logo",
                        "order_id": order.id,
                        "prefill": {
                            "contact": requestData.customer_mobile_no
                        }
                    };

                    logger.info("razorpay payment gateway response  =" + JSON.stringify(order));
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
                    resolve([false, payments]);
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


}
module.exports = RazorPaymentGatewayService;