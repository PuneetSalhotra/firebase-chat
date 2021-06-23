"use strict";

const RazorPaymentGatewayService = require('./razorpayGatewayService');
const PaymentUtil = require('../utils/paymentUtil');
const logger = require('../../logger/winstonLogger');
const moment = require('moment');
var makingRequest = require('request');
const nodeUtil = require('util');
function MerchantPaymentService(objectCollection) {

    var db = objectCollection.db;
    const util = objectCollection.util;
    const razorPaymentGatewayService = new RazorPaymentGatewayService(objectCollection);
    const paymentUtil = new PaymentUtil(objectCollection);

    //API 1 : getSignature 
    this.getSignature = async function (request) {
        logger.info("MerchantPaymentService : getSignature: ");
        let responseData = {},
            error = false;
        
        if(paymentUtil.isNotEmpty(request.merchant_id)) {
            
            let [err, responseData] = await this.getMerchant(request, request.merchant_id); 
            if (!err) {
                
                let secretKey = responseData.merchant_secret_key;
                secretKey = Buffer.from(secretKey, 'base64').toString();

                let hashText = request.amount;
                if(request.currency !== undefined) {
                    hashText = hashText + request.currency;
                } 
                if(request.customer_mobile_no !== undefined) {
                    hashText = hashText + request.customer_mobile_no;
                } 
                if(request.description !== undefined) {
                    hashText = hashText + request.description;
                } 
                
                hashText = hashText + request.merchant_id + request.merchant_txn_ref_no;
                    
                if(request.original_merchant_txn_ref_no !== undefined) {
                    hashText = hashText + request.original_merchant_txn_ref_no;
                } 

                hashText = hashText + secretKey;
                logger.info("hashText = " + hashText);
                let signature = paymentUtil.hmacSha256(hashText, secretKey);
                
                responseData = {
                    amount: request.amount,
                    currency: request.currency,
                    merchant_id: request.merchant_id,
                    merchant_txn_ref_no: request.merchant_txn_ref_no,
                    customer_mobile_no: request.customer_mobile_no,
                    description: request.description,
                    signature: signature
                } 
                
                logger.info("MerchantPaymentService : getSignature: response : " + JSON.stringify(responseData));
                return [false, responseData];
            } else {
                logger.error("createSignature| Error: ", JSON.stringify(responseData));
                return [true, responseData];
            }   
        } else {
            logger.error('Missing parameter `merchant_id`');
            return [true, { 
                errormsg : 'Missing parameter `merchant_id`'
            }];
        }
    }

    //API 2 : createOrder
    this.createOrder = async function (request) {
        logger.info("MerchantPaymentService : createOrder: request : " + JSON.stringify(request));
        let error = false;

        //Step 1: validate Each parameters
        let result = this.validatePaymentRequest(request);
        if("Ok" !== result) {
            logger.error(result);
            error = true;
            return [true, { 
                errormsg : result
            }];
        }
        
        //Step 2: Check if the merchant_id is valid
        if(paymentUtil.isNotEmpty(request.merchant_id)) {
            
            let [err, responseData] = await this.getMerchant(request, request.merchant_id); 
            if (!err) {
                let merchantData = responseData;

                //get merchant secretKey
                let secretKey = merchantData.merchant_secret_key;
                secretKey = Buffer.from(secretKey, 'base64').toString();

                //prepare hashText for validating signature
                let hashText = request.amount + request.currency + request.customer_mobile_no + request.description
                    + request.merchant_id + request.merchant_txn_ref_no + secretKey;

                let signature = paymentUtil.hmacSha256(hashText, secretKey);
                
                //Step 3: validate signature
                if(request.signature !== signature) {
                    logger.error(" merchant_id = " + request.merchant_id + ", merchant_txn_ref_no = " + request.merchant_txn_ref_no + " : Invalid parameter `signature`");
                    return [true, { 
                        errormsg : "Invalid parameter `signature`"
                    }];
                } else {
                    logger.info("merchant_id = " + request.merchant_id + ", merchant_txn_ref_no = " + request.merchant_txn_ref_no + " : valid parameter `signature`");

                    //Step 4: check duplicate order
                    let [err, paymentOrderData] = await this.getPaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no);
                    if (!err) {

                        if(paymentOrderData.length == 0) {
                            //add new order
                            request.current_date = util.getCurrentUTCTime();

                            //Step 5: Add a new record in payment order list table.
                            let [errr, order] = await this.addPaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no, merchantData.merchant_secret_key);
                            if (!errr) {
                                logger.info("payment order inserted for merchant_id = " + request.merchant_id
                                        + " merchant_txn_ref_no = " + request.merchant_txn_ref_no);
                                
                                //Step 6: generate new order at razorPaymentGateway server.
                                let [err, options] = await razorPaymentGatewayService.createOrder(request, merchantData);
                                if (!err) {

                                    //Step 7: add new payment transaction into system corresponding merchant_id and merchant_txn_ref_no
                                    let [err, data] = await this.addPaymentTransaction(request, request.merchant_id, request.merchant_txn_ref_no, options.order_id);
                                    if (!err) {
                                        logger.info("transaction inserted for merchant_id = " + request.merchant_id
                                        + " merchant_txn_ref_no = " + request.merchant_txn_ref_no);

                                        //Step 8: send response back to web.
                                        logger.info("razorPaymentGatewayService : createOrder | response = " + JSON.stringify(options));
                                        return [false, options];
                                    } else {
                                        logger.error("addPaymentTransaction| Error: ", JSON.stringify(data));
                                        return [true, data];
                                    }
                                } else {
                                    logger.error("razorPaymentGatewayService : createOrder| Error: ", JSON.stringify(options));
                                    return [true, options];
                                }
                            } else {
                                logger.error("addPaymentOrder| Error: ", JSON.stringify(order));
                                return [true, order];
                            }
                        } else {
                            logger.error('Duplicate `merchant_txn_ref_no`. Use different `merchant_txn_ref_no`');
                            return [true, { 
                                errormsg : 'Duplicate `merchant_txn_ref_no`. Use different `merchant_txn_ref_no`'
                            }];
                        }
                    } else {
                        logger.error("getPaymentOrder| Error: ", JSON.stringify(paymentOrderData));
                        return [true, paymentOrderData];
                    }
                }
            } else {
                logger.error("getMerchant| Error: ", JSON.stringify(responseData));
                return [true, responseData];
            }   
        } else {
            logger.error('Missing parameter `merchant_id`');
            return [true, { 
                errormsg : 'Missing parameter `merchant_id`'
            }];
        }
    }

    //API 3 :handlePaymentResponse
    this.handlePaymentResponse = async function (request) {
        logger.info("MerchantPaymentService : handlePaymentResponse : request : "  +  JSON.stringify(request));
        let razorpayApiKey = global.config.razorpayApiKey;
        let razorpay_payment_id = null;
        let razorpay_order_id = null;
        let razorpay_signature = null;
        let isSuccess = false;
        request.isSuccess = false;
        
        if(!paymentUtil.isNotEmpty(razorpayApiKey)) {
            logger.error('Please configure `razorpayApiKey` in globalConfig.js file');
            return [true, { 
                errormsg : 'Internal Server Error'
            }];
        }

        request.current_date = util.getCurrentUTCTime();
        if(request.hasOwnProperty("success_response")) {
            let success_response = JSON.parse(request.success_response);
            razorpay_payment_id = success_response.razorpay_payment_id;
            razorpay_order_id = success_response.razorpay_order_id;
            razorpay_signature = success_response.razorpay_signature;
            isSuccess = true;
            request.isSuccess = true;
            request.activity_status_type_id = 99;
            request.activity_type_category_id = 40;
            await this.alterStatusMakeRequest(request)                          
            // calling the status/alter/ api for and changing status to paid status_type_id = 99
            // 
        } else if(request.hasOwnProperty("failure_response")) {
            let failure_response = JSON.parse(request.failure_response);

            request.activity_status_type_id = 115;
            request.activity_type_category_id = 40;
            await this.alterStatusMakeRequest(request)
            if(failure_response.hasOwnProperty("error")) {
                let errorObj = failure_response.error;
                if(errorObj !== null) {
                    request.code = errorObj.code;
                    request.description = errorObj.description;
                    request.reason = errorObj.reason;
                    
                    let metadata = errorObj.metadata;
                    if(metadata !== null) {
                        razorpay_payment_id = metadata.payment_id;
                        razorpay_order_id = metadata.order_id;
                    } else {
                        logger.error('Invalid payment response : Empty parameter `metadata`');
                        return [true, { 
                            errormsg : 'Invalid payment response : Empty parameter `metadata`'
                        }];
                    }
                } else {
                    logger.error('Invalid payment response : Empty parameter `error`');
                    return [true, { 
                        errormsg : 'Invalid payment response : Empty parameter `error`'
                    }];
                }
            } else {
                logger.error('Invalid payment response');
                return [true, { 
                    errormsg : 'Invalid payment response : Missing parameter `error`'
                }];
            }
        } else {
            logger.error('Invalid payment response');
            return [true, { 
                errormsg : 'Invalid payment response'
            }];
        }

        if(!paymentUtil.isNotEmpty(razorpay_order_id)) {
            logger.error('Invaild parameter `razorpay_order_id`');
            return [true, { 
                errormsg : 'Invaild parameter `razorpay_order_id`'
            }];
        } 

        if(!paymentUtil.isNotEmpty(razorpay_payment_id)) {
            logger.error('Invaild parameter `razorpay_payment_id`');
            return [true, { 
                errormsg : 'Invaild parameter `razorpay_payment_id`'
            }];
        }

        if(!paymentUtil.isNotEmpty(request.merchant_id)) {
            logger.error('Invaild parameter `merchant_id`');
            return [true, { 
                errormsg : 'Invaild parameter `merchant_id`'
            }];
        }

        if(!paymentUtil.isNotEmpty(request.merchant_txn_ref_no)) {
            logger.error('Invaild parameter `merchant_txn_ref_no`');
            return [true, { 
                errormsg : 'Invaild parameter `merchant_txn_ref_no`'
            }];
        }

        if(isSuccess) {

            if(!paymentUtil.isNotEmpty(razorpay_signature)) {
                logger.error('Invaild parameter `signature`');
                return [true, { 
                    errormsg : 'Invaild parameter `signature`'
                }];
            }

            if(!this.validateResponse(razorpay_payment_id, razorpay_order_id, razorpay_signature, razorpayApiKey)) {
                logger.error('Invaild parameter `signature`');
                return [true, { 
                    errormsg : 'Invaild parameter `signature`'
                }];
            }
        }


        if(paymentUtil.isNotEmpty(request.merchant_id)) {
            
            let [err, responseData] = await this.getMerchant(request, request.merchant_id); 
            if (!err) {
                let merchantData = responseData;
                //Step 1: find payment_log_transaction using merchant_id and razorpay_order_id
                let [err, paymentTransactionData] = await this.getPaymentTransactionUsingOrderId(request, razorpay_order_id);
                if (!err) {
                    if(paymentTransactionData.length !== 0) {

                        paymentTransactionData = paymentTransactionData[0];

                        if(!(paymentTransactionData.merchant_id === request.merchant_id && paymentTransactionData.merchant_txn_ref_no === request.merchant_txn_ref_no)) {
                            logger.error('Invalid response : Invalid parameters `merchant_id`|`merchant_txn_ref_no`');
                            return [true, { 
                                errormsg : 'Invalid response : Invalid parameters `merchant_id`|`merchant_txn_ref_no`'
                            }];
                        }

                        let payment_status = paymentTransactionData.payment_status;
                        if(payment_status === 'SUC' || payment_status === 'FAI') {

                            //Step 2: send duplicate response
                            let finalResponse = {
                                merchant_id : paymentTransactionData.merchant_id,
                                merchant_txn_ref_no: paymentTransactionData.merchant_txn_ref_no,
                                amount: paymentTransactionData.amount,
                                paymentDateTime: moment(paymentTransactionData.acq_resp_date_time).utc().format("YYYY-MM-DD HH:mm:ss"),
                                authorization_code: paymentTransactionData.auth_id,
                                pg_ref_no: paymentTransactionData.auth_no,
                                transaction_id: paymentTransactionData.transaction_id,
                                payment_response_code: paymentTransactionData.response_code,
                                payment_response_desc: paymentTransactionData.response_desc
                            };
                            logger.error('Duplicate response : Payment status = ' + payment_status);
                            logger.info("sending back existing payment response = ");
                            logger.info(JSON.stringify(finalResponse));
                            return [false, finalResponse];
                        } else {

                            //Step 2: find payment_order_list 
                            let [err, paymentOrderData] = await this.getPaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no);
                            if (!err) {
                                if(paymentOrderData.length !== 0) {

                                    paymentOrderData = paymentOrderData[0];
                                    let order_status = paymentOrderData.order_status;

                                    if(order_status === 'SUC' || order_status === 'FAI') {

                                        //Step 3: send duplicate response
                                        let finalResponse = {
                                            merchant_id : paymentTransactionData.merchant_id,
                                            merchant_txn_ref_no: paymentTransactionData.merchant_txn_ref_no,
                                            amount: paymentTransactionData.amount,
                                            paymentDateTime: moment(paymentTransactionData.acq_resp_date_time).utc().format("YYYY-MM-DD HH:mm:ss"),
                                            authorization_code: paymentTransactionData.auth_id,
                                            pg_ref_no: paymentTransactionData.auth_no,
                                            transaction_id: paymentTransactionData.transaction_id,
                                            payment_response_code: paymentTransactionData.response_code,
                                            payment_response_desc: paymentTransactionData.response_desc
                                        };
                                        logger.error('Duplicate response : Payment status = ' + payment_status);
                                        logger.info("sending back existing payment response = ");
                                        logger.info(JSON.stringify(finalResponse));
                                        return [false, finalResponse];
                                    } else {

                                        //Step 3: fetch the order details using razorpay_order_id.
                                        let [err, payment] = await razorPaymentGatewayService.fetchPaymentByUsingPaymentId(razorpay_payment_id);
                                        if (!err) {
                                            
                                            if(razorpay_order_id !== payment.order_id) {
                                                logger.error('Invaild parameter `razorpay_order_id`');
                                                return [true, { 
                                                    errormsg : 'Invaild parameter `razorpay_order_id`'
                                                }];
                                            }
                                            
                                            let transaction_id = paymentTransactionData.transaction_id;
                                            logger.debug("transaction_id = " + transaction_id);
                                            let [err, paymentOrder] = await this.updatePaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no, payment, transaction_id);
                                            if (!err) {
                                                
                                                //-------------------------
                                                payment.payment_date_time = moment(payment.created_at).utc().format("YYYY-MM-DD HH:mm:ss");
                                                let payment_status = 'FAI';
                                                let response_code = "39"; 
                                                let response_description = payment.error_reason || 'FAIELD';
                                                let razorpay_payment_response = {};
                                                if(request.hasOwnProperty("failure_response")) {
                                                    razorpay_payment_response = JSON.parse(request.failure_response);
                                                    response_description = payment.error_reason;
                                                }
                                                
                                                if("captured" === payment.status) {
                                                    payment_status = 'SUC';
                                                    response_code = "00";
                                                    response_description = "SUCCESS";
                                                    razorpay_payment_response = JSON.parse(request.success_response);
                                                }
                                                payment.response_code = response_code;
                                                payment.response_desc = response_description;
                                                payment.payment_status = payment_status;
                                                payment.response_method = "WEB";
                                                payment.razorpay_payment_response = razorpay_payment_response;

                                                let auth_code = null;
                                                if(payment.hasOwnProperty("acquirer_data")) {
                                                    if(paymentUtil.isNumber(payment.acquirer_data.auth_code)) {
                                                        auth_code = payment.acquirer_data.auth_code;
                                                    }
                                                }
                                                payment.auth_code = auth_code;
                                                //-------------------------
                                                let [err, paymentTransaction] = await this.updatePaymentTransaction(request, request.merchant_id, request.merchant_txn_ref_no, payment);
                                                if (!err) {
                                                    
                                                    let order_status = 'FAI';
                                                    let response_code = "39"; 
                                                    let response_description = 'FAILED';
                                                    if("captured" === payment.status) {
                                                        order_status = 'SUC';
                                                        response_code = "00";
                                                        response_description = "SUCCESS";
                                                    } 

                                                    let payment_datetime = moment(payment.payment_date_time).utc().format("YYYY-MM-DD HH:mm:ss");

                                                    let finalResponse = {
                                                        merchant_id : request.merchant_id,
                                                        merchant_txn_ref_no: request.merchant_txn_ref_no,
                                                        amount: paymentOrderData.amount.toFixed(2),
                                                        paymentDateTime: payment_datetime,
                                                        authorization_code: payment.id,
                                                        pg_ref_no: payment.order_id,
                                                        transaction_id: transaction_id,
                                                        payment_response_code: response_code,
                                                        payment_response_desc: response_description
                                                    };
                                                    logger.info("finalResponse = ");
                                                    logger.info(JSON.stringify(finalResponse));
                                                    return [false, finalResponse];
                                                } else {
                                                    logger.error("handlePaymentResponse| updatePaymentTransaction | Error: ", err);
                                                    return [true, err];
                                                }
                                            } else {
                                                logger.error("handlePaymentResponse| updatePaymentOrder | Error: ", err);
                                                return [true, err];
                                            }
                                        } else {
                                            logger.error("handlePaymentResponse| fetchPaymentByUsingPaymentId | Error: ", err);
                                            return [true, err];
                                        }
                                    }
                                } else {
                                    logger.error('Invaild parameter `merchant_id` | `merchant_txn_ref_no`');
                                    return [true, { 
                                        errormsg : 'Invaild parameter `merchant_id` | `merchant_txn_ref_no`'
                                    }];
                                }
                            } else {
                                logger.error(err);
                                return [true, err];
                            }
                        }
                    } else {
                        logger.error("getPaymentTransactionUsingOrderId| Error: ", err);
                        return [true, { 
                            errormsg : 'Invaild parameter `razorpay_order_id`'
                        }];
                    }
                } else {
                    logger.error("getPaymentTransactionUsingOrderId| Error: ", err);
                    return [true, err];
                }
            } else {
                logger.error("getMerchant| Error: ", JSON.stringify(responseData));
                return [true, responseData];
            }   
        } else {
            logger.error('Missing parameter `merchant_id`');
            return [true, { 
                errormsg : 'Missing parameter `merchant_id`'
            }];
        }
    }
    
    //API 4 :handlePaymentResponseThroughWebhook
    this.handlePaymentResponseThroughWebhook = async function (request) {
        logger.info("MerchantPaymentService : handlePaymentResponseThroughWebhook : request : "  +  JSON.stringify(request));
        let razorpayMerchantId = global.config.razorpayMerchantId;
        
        let request_payload = request;
        
        let request_entity = {};
        if(request_payload.hasOwnProperty("payload")) {
            let payload = request_payload.payload;
            if(payload.hasOwnProperty("payment")) {
                let payment = payload.payment;
                if(payment.hasOwnProperty("entity")) {
                    request_entity = payment.entity;

                    if(request_entity === {}) {
                        logger.error('Invalid payment response | Invalid parameter `entity`');
                        return [true, { 
                            errormsg : 'Invalid payment response | Missing parameter `entity`'
                        }];
                    }
                }
            }
        }
        
        request.current_date = util.getCurrentUTCTime();
        if(!paymentUtil.isNotEmpty(razorpayMerchantId)) {
            logger.error('Please configure `razorpayMerchantId` in globalConfig.js file');
            return [true, { 
                errormsg : 'Internal Server Error'
            }];
        } else {
            if(!paymentUtil.isNotEmpty(request_payload.account_id)) {
                logger.error('Invalid payment response | Missing parameter `account_id`');
                return [true, { 
                    errormsg : 'Invalid payment response | Missing parameter `account_id`'
                }];
            } else {
                if(razorpayMerchantId !== request_payload.account_id.substring(4, request_payload.account_id.length)) {
                    logger.error('Invalid payment response | Invalid parameter `account_id`');
                    return [true, { 
                        errormsg : 'Invalid payment response | Invalid parameter `account_id`'
                    }];
                }
            }
        }

        if(!paymentUtil.isNotEmpty(request_payload.event)) {
            logger.error('Invalid payment response | Missing parameter `event`');
            return [true, { 
                errormsg : 'Invalid payment response | Missing parameter `event`'
            }];
        } 

        if(!("refund.processed" === request_payload.event || "payment.captured" === request_payload.event || "payment.failed" === request_payload.event)) {
            logger.error('Invalid payment response | Invalid parameter `event`');
            return [true, { 
                errormsg : 'Invalid payment response | Missing parameter `event`'
            }];
        }

        if("refund.processed" === request_payload.event) {
                        
            request.activity_status_type_id = 99;
            request.activity_type_category_id = 37;
            await this.alterStatusMakeRequest(request)
            return await this.handleWebhookRefundResponse(request);
        } else {
            return await this.handleWebhookPaymentResponse(request);
        }
    }

    this.handleWebhookPaymentResponse = async function(request) {
        logger.info("MerchantPaymentService : handlePaymentResponseThroughWebhook : request : "  +  JSON.stringify(request));
        let razorpayMerchantId = global.config.razorpayMerchantId;
        
        let razorpay_payment_id = null;
        let razorpay_order_id = null;
        
        let request_payload = request;
        
        let request_entity = {};
        if(request_payload.hasOwnProperty("payload")) {
            let payload = request_payload.payload;
            if(payload.hasOwnProperty("payment")) {
                let payment = payload.payment;
                if(payment.hasOwnProperty("entity")) {
                    request_entity = payment.entity;
                    if(request_entity === {}) {
                        logger.error('Invalid payment response | Invalid parameter `entity`');
                        return [true, { 
                            errormsg : 'Invalid payment response | Missing parameter `entity`'
                        }];
                    }
                }
            }
        }
        
        request.current_date = util.getCurrentUTCTime();
        if(!paymentUtil.isNotEmpty(razorpayMerchantId)) {
            logger.error('Please configure `razorpayMerchantId` in globalConfig.js file');
            return [true, { 
                errormsg : 'Internal Server Error'
            }];
        } else {
            if(!paymentUtil.isNotEmpty(request_payload.account_id)) {
                logger.error('Invalid payment response | Missing parameter `account_id`');
                return [true, { 
                    errormsg : 'Invalid payment response | Missing parameter `account_id`'
                }];
            } else {
                if(razorpayMerchantId !== request_payload.account_id.substring(4, request_payload.account_id.length)) {
                    logger.error('Invalid payment response | Invalid parameter `account_id`');
                    return [true, { 
                        errormsg : 'Invalid payment response | Invalid parameter `account_id`'
                    }];
                }
            }
        }
        
        if(!paymentUtil.isNotEmpty(request_entity.id)) {
            logger.error('Invaild parameter `razorpay_payment_id`');
            return [true, { 
                errormsg : 'Invaild parameter `razorpay_payment_id`'
            }];
        } else {
            razorpay_payment_id = request_entity.id;
        }

        if(!paymentUtil.isNotEmpty(request_entity.id)) {
            logger.error('Invaild parameter `razorpay_payment_id`');
            return [true, { 
                errormsg : 'Invaild parameter `razorpay_payment_id`'
            }];
        } else {
            razorpay_payment_id = request_entity.id;
        }

        if(!paymentUtil.isNotEmpty(request_entity.order_id)) {
            logger.error('Invaild parameter `razorpay_order_id`');
            return [true, { 
                errormsg : 'Invaild parameter `razorpay_order_id`'
            }];
        } else {
            razorpay_order_id = request_entity.order_id;
        }
        
        //Step 1: find payment_log_transaction using razorpay_order_id
        let [err, paymentTransactionData] = await this.getPaymentTransactionUsingOrderId(request, razorpay_order_id);
        if (!err) {
            if(paymentTransactionData.length !== 0) {

                paymentTransactionData = paymentTransactionData[0];
                request.merchant_id = paymentTransactionData.merchant_id;
                request.merchant_txn_ref_no = paymentTransactionData.merchant_txn_ref_no;
                
                let payment_status = paymentTransactionData.payment_status;
                if((payment_status === 'SUC' || payment_status === 'FAI') && "WEBHOOK" === paymentTransactionData.str_fld_1) {

                    //Step 2: send duplicate response
                    let finalResponse = {
                        merchant_id : paymentTransactionData.merchant_id,
                        merchant_txn_ref_no: paymentTransactionData.merchant_txn_ref_no,
                        amount: paymentTransactionData.amount,
                        paymentDateTime: moment(paymentTransactionData.acq_resp_date_time).utc().format("YYYY-MM-DD HH:mm:ss"),
                        authorization_code: paymentTransactionData.auth_id,
                        pg_ref_no: paymentTransactionData.auth_no,
                        transaction_id: paymentTransactionData.transaction_id,
                        payment_response_code: paymentTransactionData.response_code,
                        payment_response_desc: paymentTransactionData.response_desc
                    };
                    logger.error('Duplicate response : Payment status = ' + payment_status);
                    logger.info("sending back existing payment response = ");
                    logger.info(JSON.stringify(finalResponse));
                    return [false, finalResponse];
                } 

                //Step 2: find payment_order_list 
                let [err, paymentOrderData] = await this.getPaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no);
                if (!err) {
                    if(paymentOrderData.length !== 0) {

                        paymentOrderData = paymentOrderData[0];
                        
                        //Step 3: fetch the order details using razorpay_order_id.
                        let [err, payment] = await razorPaymentGatewayService.fetchPaymentByUsingPaymentId(razorpay_payment_id);
                        if (!err) {
                            
                            if(razorpay_order_id !== payment.order_id) {
                                logger.error('Invaild parameter `razorpay_order_id`');
                                return [true, { 
                                    errormsg : 'Invaild parameter `razorpay_order_id`'
                                }];
                            }
                            
                            let transaction_id = paymentTransactionData.transaction_id;
                            logger.debug("transaction_id = " + transaction_id);
                            

                            //-------------------------
                            payment.payment_date_time = moment(payment.created_at).utc().format("YYYY-MM-DD HH:mm:ss");
                            let payment_status = 'FAI';
                            let response_code = "39"; 
                            let response_description = payment.error_reason || 'FAIELD';
                            if(request.hasOwnProperty("failure_response")) {
                                response_description = request_entity.error_reason;
                            }
                            
                            if("captured" === payment.status) {
                                payment_status = 'SUC';
                                response_code = "00";
                                response_description = "SUCCESS";
                            }

                            payment.response_code = response_code;
                            payment.response_desc = response_description;
                            payment.payment_status = payment_status;
                            payment.response_method = "WEBHOOK";
                            payment.razorpay_payment_response = request_payload;

                            if("card" === payment.method) {
                                payment.method_sub_type = request_entity.card.type;
                                payment.card_network = request_entity.card.network;
                                payment.customer_name = request_entity.card.name;
                                payment.inst_id = request_entity.card.id;
                                payment.mask_id = "XXXX XXXX XXXX " + request_entity.card.last4;
                            }
                            if("netbanking" === payment.method) {
                                payment.method_sub_type = request_entity.bank;
                            }
                            if("upi" === payment.method) {
                                payment.inst_id = request_entity.vpa;
                            }
                            if("wallet" === payment.method) {
                                payment.method_sub_type = request_entity.wallet;
                            }

                            let auth_code = null;
                            if(payment.hasOwnProperty("acquirer_data")) {
                                if(paymentUtil.isNumber(payment.acquirer_data.auth_code)) {
                                    auth_code = payment.acquirer_data.auth_code;
                                }
                                if(auth_code === null && paymentUtil.isNumber(payment.acquirer_data.bank_transaction_id)) {
                                    auth_code = payment.acquirer_data.bank_transaction_id;
                                }
                                if(auth_code === null && paymentUtil.isNumber(payment.acquirer_data.transaction_id)) {
                                    auth_code = payment.acquirer_data.transaction_id;
                                }
                                if(auth_code === null && paymentUtil.isNumber(payment.acquirer_data.bank_transaction_id)) {
                                    auth_code = payment.acquirer_data.bank_transaction_id;
                                }
                                if(auth_code === null && paymentUtil.isNumber(payment.acquirer_data.rrn)) {
                                    auth_code = payment.acquirer_data.rrn;
                                }
                            }
                            payment.auth_code = auth_code;
                            //-------------------------
                            
                            let [err, paymentTransaction] = await this.updatePaymentTransaction(request, request.merchant_id, request.merchant_txn_ref_no, payment);
                            if (!err) {
                                
                                if("SUC" === paymentOrderData.order_status || "FAI" === paymentOrderData.order_status) {
                                    let order_status = 'FAI';
                                    let response_code = "39"; 
                                    let response_description = 'FAILED';
                                    request.isSuccess = false
                                    if("captured" === payment.status) {
                                        order_status = 'SUC';
                                        response_code = "00";
                                        response_description = "SUCCESS";
                                        request.isSuccess = true
                                    } 

                                    let payment_datetime = moment(payment.payment_date_time).utc().format("YYYY-MM-DD HH:mm:ss");

                                    let finalResponse = {
                                        merchant_id : request.merchant_id,
                                        merchant_txn_ref_no: request.merchant_txn_ref_no,
                                        amount: paymentOrderData.amount.toFixed(2),
                                        paymentDateTime: payment_datetime,
                                        authorization_code: payment.id,
                                        pg_ref_no: payment.order_id,
                                        transaction_id: transaction_id,
                                        payment_response_code: response_code,
                                        payment_response_desc: response_description
                                    };                       
                                    logger.info("finalResponse = ");
                                    logger.info(JSON.stringify(finalResponse));
                                    return [false, finalResponse];
                                } else {
                                    let [err, paymentOrder] = await this.updatePaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no, payment, transaction_id);
                                    if (!err) {  
                                        let order_status = 'FAI';
                                        let response_code = "39"; 
                                        let response_description = request_entity.error_reason|| 'FAILED';

                                        if("captured" === payment.status) {
                                            order_status = 'SUC';
                                            response_code = "00";
                                            response_description = "SUCCESS";
                                        } 

                                        let payment_datetime = moment(payment.payment_date_time).utc().format("YYYY-MM-DD HH:mm:ss");

                                        let finalResponse = {
                                            merchant_id : request.merchant_id,
                                            merchant_txn_ref_no: request.merchant_txn_ref_no,
                                            amount: paymentOrderData.amount.toFixed(2),
                                            paymentDateTime: payment_datetime,
                                            authorization_code: payment.id,
                                            pg_ref_no: payment.order_id,
                                            transaction_id: transaction_id,
                                            payment_response_code: response_code,
                                            payment_response_desc: response_description
                                        };
                                        logger.info("finalResponse = ");
                                        logger.info(JSON.stringify(finalResponse));
                                        return [false, finalResponse];
                                    } else {
                                        logger.error("handlePaymentResponse| updatePaymentOrder | Error: ", err);
                                        return [true, err];
                                    }
                                }
                            } else {
                                logger.error("handlePaymentResponse| updatePaymentTransaction | Error: ", err);
                                return [true, err];
                            }
                        } else {
                            logger.error("handlePaymentResponse| fetchPaymentByUsingPaymentId | Error: ", err);
                            return [true, err];
                        }
                    } else {
                        logger.error('Invaild parameter `merchant_id` | `merchant_txn_ref_no`');
                        return [true, { 
                            errormsg : 'Invaild parameter `merchant_id` | `merchant_txn_ref_no`'
                        }];
                    }
                } else {
                    logger.error(err);
                    return [true, err];
                }
            } else {
                logger.error("getPaymentTransactionUsingOrderId| Error: ", err);
                return [true, { 
                    errormsg : 'Invaild parameter `razorpay_order_id`'
                }];
            }
        } else {
            logger.error("getPaymentTransactionUsingOrderId| Error: ", err);
            return [true, err];
        }
    }

    this.handleWebhookRefundResponse = async function(request) {
        let razorpayMerchantId = global.config.razorpayMerchantId;
        
        let razorpay_payment_id = null;
        let razorpay_order_id = null;
        let razorpay_refund_id = null;
        
        let request_payload = request;
        
        let request_payment_entity = {};
        let request_refund_entity = {};

        if(request_payload.hasOwnProperty("payload")) {
            let payload = request_payload.payload;
            if(payload.hasOwnProperty("refund")) {
                let refund = payload.refund;
                if(refund.hasOwnProperty("entity")) {
                    request_refund_entity = refund.entity;
                    if(request_refund_entity === {}) {
                        logger.error('Invalid refund response | Invalid parameter `entity`');
                        return [true, { 
                            errormsg : 'Invalid refund response | Missing parameter `entity`'
                        }];
                    }
                }
            }

            if(payload.hasOwnProperty("refund")) {
                let payment = payload.payment;
                if(payment.hasOwnProperty("entity")) {
                    request_payment_entity = payment.entity;
                    if(request_payment_entity === {}) {
                        logger.error('Invalid payment response | Invalid parameter `entity`');
                        return [true, { 
                            errormsg : 'Invalid payment response | Missing parameter `entity`'
                        }];
                    }
                }
            }
        }
        
        request.current_date = util.getCurrentUTCTime();
        if(!paymentUtil.isNotEmpty(razorpayMerchantId)) {
            logger.error('Please configure `razorpayMerchantId` in globalConfig.js file');
            return [true, { 
                errormsg : 'Internal Server Error'
            }];
        } else {
            if(!paymentUtil.isNotEmpty(request_payload.account_id)) {
                logger.error('Invalid payment response | Missing parameter `account_id`');
                return [true, { 
                    errormsg : 'Invalid payment response | Missing parameter `account_id`'
                }];
            } else {
                if(razorpayMerchantId !== request_payload.account_id.substring(4, request_payload.account_id.length)) {
                    logger.error('Invalid payment response | Invalid parameter `account_id`');
                    return [true, { 
                        errormsg : 'Invalid payment response | Invalid parameter `account_id`'
                    }];
                }
            }
        }
        
        if(!paymentUtil.isNotEmpty(request_payment_entity.id)) {
            logger.error('Invaild parameter `razorpay_payment_id`');
            return [true, { 
                errormsg : 'Invaild parameter `razorpay_payment_id`'
            }];
        } else {
            razorpay_payment_id = request_payment_entity.id;
        }

        if(!paymentUtil.isNotEmpty(request_refund_entity.id)) {
            logger.error('Invaild parameter `razorpay_refund_id`');
            return [true, { 
                errormsg : 'Invaild parameter `razorpay_refund_id`'
            }];
        } else {
            razorpay_refund_id = request_refund_entity.id;
        }

        if(!paymentUtil.isNotEmpty(request_payment_entity.order_id)) {
            logger.error('Invaild parameter `razorpay_order_id`');
            return [true, { 
                errormsg : 'Invaild parameter `razorpay_order_id`'
            }];
        } else {
            razorpay_order_id = request_payment_entity.order_id;
        }
        
        //Step 1: find payment_log_transaction using razorpay_refund_id
        let [err, refundTransactionData] = await this.getRefundTransactionUsingRefundId(request, razorpay_refund_id);
        if (!err) {
            if(refundTransactionData.length !== 0) {
                logger.error("Duplicate Response| Error: ");
                return [true, { 
                    errormsg : 'Duplicate Response'
                }];
            } else {

                //Step 2: fetch the order details using razorpay_order_id.
                let [err, refund] = await razorPaymentGatewayService.fetchRefundByUsingRefundId(razorpay_payment_id, razorpay_refund_id);
                if (!err) {

                    //Step 3: fetch the payment details using razorpay_order_id.
                    let [err, paymentTransactionData] = await this.getPaymentTransactionUsingOrderId(request, razorpay_order_id);
                    if (!err) {

                        if(paymentTransactionData.length !== 0) {
                            
                            paymentTransactionData = paymentTransactionData[0];
                            
                            let payment_status = paymentTransactionData.payment_status;
                            if(payment_status === 'SUC' && paymentTransactionData.remaining_amount > 0) {
                                
                                    
                                if(razorpay_payment_id !== refund.payment_id && paymentTransactionData.auth_id !== refund.payment_id) {
                                    logger.error('Invaild parameter `razorpay_order_id`');
                                    return [true, { 
                                        errormsg : 'Invaild parameter `razorpay_order_id`'
                                    }];
                                }
                                
                                let transaction_id = paymentTransactionData.transaction_id;
                                logger.debug("transaction_id = " + transaction_id);
                                
                                let refund_amount = refund.amount/100;
                                let refund_date_time = moment(refund.created_at).utc().format("YYYY-MM-DD HH:mm:ss");
                                
                                let refund_status = "FAI";
                                let refund_resp_code = "39";
                                let refund_resp_desc = "Refund Failed";

                                if("processed" === refund.status) {
                                    refund_status = "SUC";
                                    refund_resp_code = "00";
                                    refund_resp_desc = "Refund Processed";
                                }

                                let refund_txn_no = paymentUtil.generateUniqueID();
                                const refundArray = new Array(
                                    paymentUtil.generateUniqueID(),
                                    paymentTransactionData.merchant_id,
                                    refund_txn_no,
                                    request.current_date,
                                    refund_date_time,
                                    "REFUND",
                                    refund_amount,
                                    0.00,
                                    paymentTransactionData.currency_cd,
                                    paymentTransactionData.country_cd,
                                    paymentTransactionData.customer_name,
                                    paymentTransactionData.customer_mob_no,
                                    paymentTransactionData.payment_inst_type,
                                    paymentTransactionData.payment_inst_sub_type,
                                    paymentTransactionData.encrypted_payment_inst_id,
                                    paymentTransactionData.masked_payment_inst_id,
                                    paymentTransactionData.card_network,
                                    razorpay_refund_id,
                                    paymentTransactionData.auth_id,
                                    refund_resp_code,
                                    null,
                                    refund_resp_code,
                                    refund_resp_desc,
                                    refund_status,
                                    paymentTransactionData.acquirer_id,
                                    paymentTransactionData.gateway_id,
                                    paymentTransactionData.acquirer_merchant_id,
                                    0.00,
                                    0.00,
                                    "WEBHOOK",
                                    refund.acquirer_data.arn,
                                    paymentTransactionData.auth_no,
                                    JSON.stringify(request_payload),
                                    paymentTransactionData.transaction_id
                                );

                                //Step 4: Add refund transaction.
                                let [err, refundTransactionData1] = await this.addRefundTransaction(request, paymentTransactionData.merchant_id, refund_txn_no, refundArray);
                                if (!err) {

                                    //Step 5: Update parent payment transaction.
                                    let [err, refundData] = await this.updatePaymentTransactionForRefund(request, transaction_id, refund_amount);
                                    if (!err) {
                                        logger.info(refund_resp_desc);
                                        return [false, refund_resp_desc];
                                    } else {
                                        logger.error("handlePaymentResponse| updatePaymentTransactionForRefund | Error: ", err);
                                        return [true, err];
                                    }
                                } else {
                                    logger.error("handlePaymentResponse| getPaymentTransactionUsingOrderId | Error: ", err);
                                    return [true, err];
                                }
                            } else {
                                logger.error("refund not allowed| Error: ");
                                return [true, { 
                                    errormsg : 'refund not allowed'
                                }];
                            }
                        }
                    } else {
                        logger.error("getPaymentTransactionUsingOrderId| Error: ", err);
                        return [true, { 
                            errormsg : 'Invaild parameter `razorpay_order_id`'
                        }];
                    }
                } else {
                    logger.error("handlePaymentResponse| fetchPaymentByUsingPaymentId | Error: ", err);
                    return [true, err];
                }
            }
        } else {
            logger.error("getPaymentTransactionUsingOrderId| Error: ", err);
            return [true, err];
        }
    }

    //API 5 :status check.
    this.statusCheck = async function(request) {
        logger.info("MerchantPaymentService : statusCheck : request : "  +  JSON.stringify(request));
        let razorpayApiKey = global.config.razorpayApiKey;
	    let razorpayMerchantId = global.config.razorpayMerchantId;


        if(!paymentUtil.isNotEmpty(request.merchant_id)) {
            logger.error('Invaild parameter `merchant_id`');
            return [true, { 
                errormsg : 'Invaild parameter `merchant_id`'
            }];
        }
    
        if(!paymentUtil.isNotEmpty(request.merchant_txn_ref_no)) {
            logger.error('Invaild parameter `merchant_txn_ref_no`');
            return [true, { 
                errormsg : 'Invaild parameter `merchant_txn_ref_no`'
            }];
        }

        if(paymentUtil.isNotEmpty(request.merchant_id)) {
		
            let [err, responseData] = await this.getMerchant(request, request.merchant_id); 
            if (!err) {
                let merchantData = responseData;

                //Step 1: find order details using merchant_id and merchant_txn_ref_no
                let [err, paymentOrderData] = await this.getPaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no);
                if (!err) {
                    if(paymentOrderData.length !== 0) {

                        paymentOrderData = paymentOrderData[0];
                        let order_status = paymentOrderData.order_status;

                        //Step 2: find payment_log_transaction using merchant_id and merchant_txn_ref_no
                        let [err, paymentTransactionData] = await this.getPaymentTransaction(request, request.merchant_id, request.merchant_txn_ref_no);
                        if (!err) {
                            if(paymentTransactionData.length !== 0) {
            
                                paymentTransactionData = paymentTransactionData[0];
                                let payment_status = paymentTransactionData.payment_status;
                                let razorpay_order_id = paymentTransactionData.auth_no;

                                if(payment_status === 'SUC' || payment_status === 'FAI') {
            
                                    //Step 2: send duplicate response
                                    let finalResponse = {
                                        merchant_id : paymentTransactionData.merchant_id,
                                        merchant_txn_ref_no: paymentTransactionData.merchant_txn_ref_no,
                                        amount: paymentTransactionData.amount,
                                        paymentDateTime: moment(paymentTransactionData.acq_resp_date_time).utc().format("YYYY-MM-DD HH:mm:ss"),
                                        authorization_code: paymentTransactionData.auth_id,
                                        pg_ref_no: paymentTransactionData.auth_no,
                                        transaction_id: paymentTransactionData.transaction_id,
                                        payment_response_code: paymentTransactionData.response_code,
                                        payment_response_desc: paymentTransactionData.response_desc
                                    };
                                    logger.error('Duplicate response : Payment status = ' + payment_status);
                                    logger.info("sending back existing payment response = ");
                                    logger.info(JSON.stringify(finalResponse));
                                    return [false, finalResponse];
                                } else {

                                    //Pending Status

                                    //Step 3: fetch the order details using razorpay_order_id.
                                    let [err, razorpay_payment] = await razorPaymentGatewayService.fetchPaymentsByUsingOrderId(razorpay_order_id);
                                    if (!err) {
                                        if(razorpay_payment.id === undefined) {
                                            //Pending status
                                            let finalResponse = {
                                                merchant_id : request.merchant_id,
                                                merchant_txn_ref_no: request.merchant_txn_ref_no,
                                                pg_ref_no: paymentTransactionData.auth_no,
                                                transaction_id: paymentTransactionData.transaction_id,
                                                response_code: "000",
                                                payment_response_code: "21",
                                                payment_response_desc: "PENDING"
                                            };
                                            logger.info("finalResponse = ");
                                            logger.info(JSON.stringify(finalResponse));
                                            return [false, finalResponse];
                                        } else {
                                            //handle payment SUC or FAI response.
                                            let payment = {};
                                            Object.assign(payment, razorpay_payment);

                                            if(razorpay_order_id !== payment.order_id) {
                                                logger.error('Invaild parameter `razorpay_order_id`');
                                                return [true, { 
                                                    errormsg : 'Invaild parameter `razorpay_order_id`'
                                                }];
                                            }
                                            
                                            let transaction_id = paymentTransactionData.transaction_id;
                                            logger.debug("transaction_id = " + transaction_id);
                                            

                                            //-------------------------
                                            payment.payment_date_time = moment(payment.created_at).utc().format("YYYY-MM-DD HH:mm:ss");
                                            let payment_status = 'FAI';
                                            let response_code = "39"; 
                                            let response_description = payment.error_reason || 'FAIELD';
                                            
                                            if("captured" === payment.status) {
                                                payment_status = 'SUC';
                                                response_code = "00";
                                                response_description = "SUCCESS";
                                            }

                                            payment.response_code = response_code;
                                            payment.response_desc = response_description;
                                            payment.payment_status = payment_status;
                                            payment.response_method = "STATUS_CHECK";
                                            payment.razorpay_payment_response = razorpay_payment;

                                            if("netbanking" === payment.method) {
                                                payment.method_sub_type = payment.bank;
                                            }
                                            if("upi" === payment.method) {
                                                payment.inst_id = payment.vpa;
                                            }
                                            if("wallet" === payment.method) {
                                                payment.method_sub_type = payment.wallet;
                                            }

                                            let auth_code = null;
                                            if(payment.hasOwnProperty("acquirer_data")) {
                                                if(paymentUtil.isNumber(payment.acquirer_data.auth_code)) {
                                                    auth_code = payment.acquirer_data.auth_code;
                                                }
                                                if(auth_code === null && paymentUtil.isNumber(payment.acquirer_data.bank_transaction_id)) {
                                                    auth_code = payment.acquirer_data.bank_transaction_id;
                                                }
                                                if(auth_code === null && paymentUtil.isNumber(payment.acquirer_data.transaction_id)) {
                                                    auth_code = payment.acquirer_data.transaction_id;
                                                }
                                                if(auth_code === null && paymentUtil.isNumber(payment.acquirer_data.bank_transaction_id)) {
                                                    auth_code = payment.acquirer_data.bank_transaction_id;
                                                }
                                                if(auth_code === null && paymentUtil.isNumber(payment.acquirer_data.rrn)) {
                                                    auth_code = payment.acquirer_data.rrn;
                                                }
                                            }
                                            payment.auth_code = auth_code;
                                            //-------------------------
                                            
                                            let [err, paymentTransaction] = await this.updatePaymentTransaction(request, request.merchant_id, request.merchant_txn_ref_no, payment);
                                            if (!err) {
                                                let [err, paymentOrder] = await this.updatePaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no, payment, transaction_id);
                                                if (!err) {  
                                                    let order_status = 'FAI';
                                                    let response_code = "39"; 
                                                    let response_description = razorpay_payment.error_reason|| 'FAILED';

                                                    if("captured" === payment.status) {
                                                        order_status = 'SUC';
                                                        response_code = "00";
                                                        response_description = "SUCCESS";
                                                    } 

                                                    let payment_datetime = moment(payment.payment_date_time).utc().format("YYYY-MM-DD HH:mm:ss");

                                                    let finalResponse = {
                                                        merchant_id : request.merchant_id,
                                                        merchant_txn_ref_no: request.merchant_txn_ref_no,
                                                        amount: paymentOrderData.amount.toFixed(2),
                                                        paymentDateTime: payment_datetime,
                                                        authorization_code: payment.id,
                                                        pg_ref_no: payment.order_id,
                                                        transaction_id: transaction_id,
                                                        response_code: "000",
                                                        payment_response_code: response_code,
                                                        payment_response_desc: response_description
                                                    };
                                                    logger.info("finalResponse = ");
                                                    logger.info(JSON.stringify(finalResponse));
                                                    return [false, finalResponse];
                                                } else {
                                                    logger.error("statusCheck| updatePaymentOrder | Error: ", err);
                                                    return [true, err];
                                                }
                                            } else {
                                                logger.error("statusCheck| updatePaymentTransaction | Error: ", err);
                                                return [true, err];
                                            }
                                        }
                                    } else {
                                        logger.error("statusCheck| fetchPaymentByUsingPaymentId | Error: ", err);
                                        return [true, err];
                                    }
                                }
                            } else {
                                logger.error("statusCheck | getPaymentTransactionUsingOrderId| Error: ", err);
                                return [true, { 
                                    errormsg : 'Invaild parameter `razorpay_order_id`'
                                }];
                            }
                        } else {
                            logger.error("statusCheck | getPaymentTransactionUsingOrderId| Error: ", err);
                            return [true, err];
                        }
                    } else {
                        logger.error('statusCheck | Invaild parameter `merchant_id` | `merchant_txn_ref_no`');
                        return [true, { 
                            errormsg : 'Invaild parameter `merchant_id` | `merchant_txn_ref_no`'
                        }];
                    }
                } else {
                    logger.error(err);
                    return [true, err];
                }
            } else {
                logger.error("statusCheck | getMerchant| Error: ", JSON.stringify(responseData));
                return [true, responseData];
            }   
        } else {
            logger.error('statusCheck | Missing parameter `merchant_id`');
            return [true, { 
                errormsg : 'Missing parameter `merchant_id`'
            }];
        }
    }

    //API 6 :Raise new Refund.
    this.createRefund = async function(request) {
        logger.info("MerchantPaymentService : createRefund : request : "  +  JSON.stringify(request));
        let razorpayApiKey = global.config.razorpayApiKey;
	    let razorpayMerchantId = global.config.razorpayMerchantId;

        //Step 1: validate Each parameters
        let result = this.validateRefundRequest(request);
        if("Ok" !== result) {
            logger.error(result);
            error = true;
            return [true, { 
                errormsg : result
            }];
        }

        if(paymentUtil.isNotEmpty(request.merchant_id)) {
            
            //Setp 2: validate merchant_id
            let [err, responseData] = await this.getMerchant(request, request.merchant_id); 
            if (!err) {
                let merchantData = responseData;

                //get merchant secretKey
                let secretKey = merchantData.merchant_secret_key;
                secretKey = Buffer.from(secretKey, 'base64').toString();

                //prepare hashText for validating signature
                let hashText = request.amount + request.merchant_id + request.merchant_txn_ref_no + request.original_merchant_txn_ref_no + secretKey;
                logger.info("hashText = " + hashText);
                let signature = paymentUtil.hmacSha256(hashText, secretKey);
                
                //Step 3: validate signature
                if(request.signature !== signature) {
                    logger.error(" merchant_id = " + request.merchant_id + ", merchant_txn_ref_no = " + request.merchant_txn_ref_no + " : Invalid parameter `signature`");
                    return [true, { 
                        errormsg : "Invalid parameter `signature`"
                    }];
                } else {
                    //Step 4: find order details using merchant_id and merchant_txn_ref_no
                    let [err, paymentOrderData] = await this.getPaymentOrder(request, request.merchant_id, request.original_merchant_txn_ref_no);
                    if (!err) {
                        if(paymentOrderData.length !== 0) {

                            paymentOrderData = paymentOrderData[0];

                            //Step 5: find payment_log_transaction using merchant_id and merchant_txn_ref_no
                            let [err, paymentTransactionData] = await this.getPaymentTransaction(request, request.merchant_id, request.original_merchant_txn_ref_no);
                            if (!err) {
                                if(paymentTransactionData.length !== 0) {
                
                                    paymentTransactionData = paymentTransactionData[0];
                                    let payment_status = paymentTransactionData.payment_status;
                                    logger.info("merchant_txn_ref_no = " + paymentTransactionData.merchant_txn_ref_no + " : payment status = " + paymentTransactionData.payment_status);
                                    
                                    if(payment_status === 'SUC') {

                                        if((paymentTransactionData.remaining_amount > 0) && (request.amount <= paymentTransactionData.remaining_amount)) {
                                            //Step 6: initiate a new refund using razorpay_payment_id.
                                            let [err, razorpay_payment] = await razorPaymentGatewayService.createRefund(paymentTransactionData.auth_id, { amount : Number(request.amount)*100});
                                            if (!err) {
                                                //Pending status
                                                let finalResponse = {
                                                    merchant_id : request.merchant_id,
                                                    merchant_txn_ref_no: request.merchant_txn_ref_no,
                                                    original_merchant_txn_ref_no: request.original_merchant_txn_ref_no,
                                                    pg_ref_no: paymentTransactionData.auth_no,
                                                    transaction_id: paymentTransactionData.transaction_id,
                                                    payment_response_code: "000",
                                                    payment_response_desc: "Refund initiated successfully"
                                                };
                                                logger.info("finalResponse = ");
                                                logger.info(JSON.stringify(finalResponse));
                                                return [false, finalResponse];
                                            } else {
                                                logger.error(err);
                                                return [true, err];
                                            }
                                        } else {
                                            logger.error('Refund not allowed');
                                            return [true, { 
                                                errormsg : 'Refund not allowed'
                                            }];
                                        }
                                    } else {
                                        logger.error('Refund not allowed');
                                        return [true, { 
                                            errormsg : 'Refund not allowed'
                                        }];
                                    }
                                } else {
                                    logger.error("createRefund | getPaymentTransactionUsingOrderId| Error: ", err);
                                    return [true, { 
                                        errormsg : 'Invaild parameter `razorpay_order_id`'
                                    }];
                                }
                            } else {
                                logger.error("createRefund | getPaymentTransaction| Error: ", err);
                                return [true, err];
                            }
                        } else {
                            logger.error('createRefund | Invaild parameter `merchant_id` | `merchant_txn_ref_no`');
                            return [true, { 
                                errormsg : 'Invaild parameter `merchant_id` | `merchant_txn_ref_no`'
                            }];
                        }
                    } else {
                        logger.error(err);
                        return [true, err];
                    }
                }
            } else {
                logger.error("statusCheck | getMerchant| Error: ", JSON.stringify(responseData));
                return [true, responseData];
            }   
        } else {
            logger.error('statusCheck | Missing parameter `merchant_id`');
            return [true, { 
                errormsg : 'Missing parameter `merchant_id`'
            }];
        }
    }

    // Supportive Functions
    this.getMerchant = async function(request, merchant_id) {
        logger.info("MerchantPaymentService : getMerchant : merchant_id = " + merchant_id);
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            merchant_id
        );
        const queryString = util.getQueryString('ds_p1_merchant_list_select_id', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    if(data.length === 0) {
                        logger.error("MerchantPaymentService : getMerchant : Invalid parameter `merchant_id` = " + request.merchant_id);
                        error = true;
                        responseData = {
                            errormsg : "Invalid parameter `merchant_id`"
                        };
                    } else {
                        responseData = data[0];
                        if("ACT" === responseData.merchant_status) {
                            error = false;
                        } else {
                            error = true;
                            logger.error("Inactive `merchant_id` = " + merchant_id);
                            responseData = {
                                errormsg : "Inactive `merchant_id` = " + merchant_id
                            };
                        }
                    }
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : getMerchant : merchant_id = " + request.merchant_id + " : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }  

    this.getPaymentOrder = async function(request, merchant_id, merchant_txn_ref_no) {
        logger.info("MerchantPaymentService : getPaymentOrder : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no);
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            merchant_id,
            merchant_txn_ref_no
        );
        const queryString = util.getQueryString('ds_p1_payment_order_list_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : getPaymentOrder : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no + " : Error:");
                    logger.error("MerchantPaymentService : getPaymentOrder : ds_p1_payment_order_list_select : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }

    this.getPaymentTransaction = async function(request, merchant_id, merchant_txn_ref_no) {
        logger.info("MerchantPaymentService : getPaymentTransaction : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no);
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            merchant_id,
            merchant_txn_ref_no
        );
        const queryString = util.getQueryString('ds_p1_payment_log_transaction_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    if(data.length === 0) {
                        logger.error("MerchantPaymentService : getPaymentTransaction : merchant_id = " + merchant_id +
                        " merchant_txn_ref_no = " + merchant_txn_ref_no);
                        error = true;
                        responseData = {
                            errormsg : "Invalid `merchant_id` & `merchant_txn_ref_no`"
                        };
                    } else {
                        responseData = data;
                        error = false;
                    }
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : getPaymentTransaction : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no + " : Error:");
                    logger.error("MerchantPaymentService : getPaymentTransaction : ds_p1_payment_log_transaction_select : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }

    this.getPaymentTransactionUsingOrderId = async function(request, razorpay_order_id) {
        logger.info("MerchantPaymentService : getPaymentTransactionUsingOrderId :  razorpay_order_id = " + razorpay_order_id);
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            razorpay_order_id
        );
        const queryString = util.getQueryString('ds_p1_payment_log_transaction_select_auth_no', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : getPaymentTransactionUsingOrderId :  razorpay_order_id = " + razorpay_order_id + " : Error:");
                    logger.error("MerchantPaymentService : getPaymentTransactionUsingOrderId : ds_p1_payment_log_transaction_select_auth_no : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }

    this.getRefundTransactionUsingRefundId = async function(request, razorpay_refund_id) {
        logger.info("MerchantPaymentService : getRefundTransactionUsingRefundId :  razorpay_refund_id = " + razorpay_refund_id);
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            razorpay_refund_id
        );
        const queryString = util.getQueryString('ds_p1_payment_log_transaction_select_auth_no', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : getRefundTransactionUsingRefundId :  razorpay_refund_id = " + razorpay_refund_id + " : Error:");
                    logger.error("MerchantPaymentService : getRefundTransactionUsingRefundId : ds_p1_payment_log_transaction_select_auth_no : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }
    
    this.addPaymentOrder = async function(request, merchant_id, merchant_txn_ref_no, merchant_key) {
        logger.info("MerchantPaymentService : addPaymentOrder : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no);
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            paymentUtil.generateUniqueID(),
            request.merchant_id,
            request.merchant_txn_ref_no,
            Number(request.amount).toFixed(2),
            request.currency,
            null,
            null,
            'PAYMENT',
            null, 
            request.customer_mobile_no || null,
            request.addl_param_1 || null,
            request.addl_param_2 || null,
            'REQ',
            merchant_key,
            request.current_date,
            request.client_ip_address || null
        );
        const queryString = util.getQueryString('ds_p1_payment_order_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    error = false;
                    responseData = data;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : addPaymentOrder : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no + " : Error:");
                    logger.error("MerchantPaymentService : addPaymentOrder : ds_p1_payment_order_list_insert : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }
    
    this.addPaymentTransaction = async function(request, merchant_id, merchant_txn_ref_no, payment_order_id) {
        logger.info("MerchantPaymentService : addPaymentTransaction : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no);
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            paymentUtil.generateUniqueID(),
            request.merchant_id,
            request.merchant_txn_ref_no,
            request.current_date,
            'PAYMENT',
            Number(request.amount).toFixed(2),
            Number(request.amount).toFixed(2),
            request.currency,
            null,
            null, 
            request.customer_mobile_no || null,
            null,
            null,
            null,
            payment_order_id,
            null,
            null,
            global.config.razorpayMerchantId,
            Number("0.00").toFixed(2),
            Number("0.00").toFixed(2),
            request.reservation_id,
            request.workforce_id || 2085,
            request.account_id || 452,
            request.organization_id || 351
            //"REQ"
        );

        const queryString = util.getQueryString('ds_p1_payment_log_transaction_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    error = false;
                    responseData = data;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : addPaymentTransaction : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no + " : Error:");
                    logger.error("MerchantPaymentService : addPaymentTransaction : ds_p1_payment_log_transaction_insert : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }

    this.addRefundTransaction = async function(request, merchant_id, merchant_txn_ref_no, refundArray) {
        logger.info("MerchantPaymentService : addRefundTransaction : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no);
        let responseData = {},
            error = true;

        const queryString = util.getQueryString('ds_p1_payment_log_transaction_insert_refund', refundArray);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    error = false;
                    responseData = data;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : addRefundTransaction : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no + " : Error:");
                    logger.error("MerchantPaymentService : addRefundTransaction : ds_p1_payment_log_transaction_insert_refund : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }

    this.updatePaymentOrder = async function(request, merchant_id, merchant_txn_ref_no, payment, transaction_id) {
        logger.info("MerchantPaymentService : updatePaymentOrder : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no);
        let responseData = {},
            error = true;

        let order_status = 'FAI';
        let response_code = "39"; 
        let response_description = request.reason || 'FAIELD';
        if("captured" === payment.status) {
            order_status = 'SUC';
            response_code = "00";
            response_description = "SUCCESS";
        } 
        const paramsArr = new Array(
            order_status,
            payment.method,
            null,
            transaction_id,
            merchant_id,
            merchant_txn_ref_no
        );

        const queryString = util.getQueryString('ds_p1_payment_order_list_update', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    error = false;
                    responseData = data;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : updatePaymentOrder : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no + " : Error:");
                    logger.error("MerchantPaymentService : updatePaymentOrder : ds_p1_payment_order_list_update : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }

    this.updatePaymentTransaction = async function(request, merchant_id, merchant_txn_ref_no, payment) {
        logger.info("MerchantPaymentService : updatePaymentTransaction : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no);
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            payment.payment_date_time,
            payment.method,
            payment.method_sub_type || null,
            payment.inst_id || null,
            payment.mask_id || null,
            payment.card_network || null,
            payment.order_id,
            payment.id,
            payment.response_code,
            null,
            payment.response_code,
            payment.response_desc,
            payment.payment_status,
            payment.response_method,
            merchant_id,
            merchant_txn_ref_no,
            payment.customer_name || null,
            payment.fee || null,
            payment.tax || null,
            payment.auth_code || null,
            null,
            JSON.stringify(payment.razorpay_payment_response)
        );
        const queryString = util.getQueryString('ds_p1_payment_log_transaction_update', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    error = false;
                    responseData = data;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : updatePaymentTransaction : merchant_id = " + merchant_id +
        " merchant_txn_ref_no = " + merchant_txn_ref_no +" : Error:");
                    logger.error("MerchantPaymentService : updatePaymentTransaction : ds_p1_payment_log_transaction_update : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }

    this.updatePaymentTransactionForRefund = async function(request, transaction_id, decrement_by) {
        logger.info("MerchantPaymentService : updatePaymentTransactionForRefund : transaction_id = " + transaction_id +
        " decrement_by = " + decrement_by);
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            transaction_id,
            decrement_by,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_payment_log_transaction_update_rem_amount', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    error = false;
                    responseData = data;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : updatePaymentTransactionForRefund : transaction_id = " + transaction_id +
        " decrement_by = " + decrement_by +" : Error:");
                    logger.error("MerchantPaymentService : updatePaymentTransactionForRefund : ds_p1_payment_log_transaction_update : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }

    this.validateResponse = function(razorpay_payment_id, razorpay_order_id, signature, razorpayApiKey) {
        logger.info("validate payment response signature=>");
        let hashText = razorpay_order_id + "|" + razorpay_payment_id;

        let isValidResponse = paymentUtil.isValidHmacSha256(hashText, signature , razorpayApiKey);
        if(isValidResponse) {
            logger.info(razorpay_order_id + " : Valid payment response signature");
        } else {
            logger.error(razorpay_order_id + " : Invalid payment response parameter signature.");
        }
        return isValidResponse;
    }

    this.validatePaymentRequest = function(request) {
        logger.info("validate payment request parameters=>");
        let mandatoryParams = ["amount", "currency", "customer_mobile_no", "description", "merchant_id", "merchant_txn_ref_no","signature"];
        let result = paymentUtil.isParameterExists(mandatoryParams, request);
        if('Ok' !== result) {
            logger.error(result);
            return result;
        }

        let isValidNum = paymentUtil.isNumber(request.amount);
        if(!isValidNum) {
            logger.error('Invalid parameter `amount`');
            return 'Invalid parameter `amount`';
        } 
        logger.info("all parameters are valid");
        return 'Ok';
    }

    this.validateRefundRequest = function(request) {
        logger.info("validate payment request parameters=>");
        let mandatoryParams = ["amount", "merchant_id", "merchant_txn_ref_no", "original_merchant_txn_ref_no","signature"];
        let result = paymentUtil.isParameterExists(mandatoryParams, request);
        if('Ok' !== result) {
            logger.error(result);
            return result;
        }

        let isValidNum = paymentUtil.isNumber(request.amount);
        if(!isValidNum) {
            logger.error('Invalid parameter `amount`');
            return 'Invalid parameter `amount`';
        } 
        logger.info("all parameters are valid");
        return 'Ok';
    }

    this.alterStatusMakeRequest = async function (request) {

        request.activity_status_name;

        let x = JSON.stringify({
                "activity_reference": [{
                    "activity_id": request.activity_id,
                    "activity_title": ""
                }],
                "asset_reference": [{}],
                "attachments": [],
                "content": "Status updated to "+request.activity_status_name,
                "mail_body": "Status updated to "+request.activity_status_name,
                "subject": "Status updated to "+request.activity_status_name
            });

        const [err2, activityStatus] = await self.getActivityStatusV1(request);
        request.activity_status_id = activityStatus[0].activity_status_id;              
        const alterStatusRequest = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: request.asset_id,
            auth_asset_id:request.auth_asset_id,
            asset_token_auth: request.asset_token_auth,
            asset_message_counter: 0,
            activity_id: request.activity_id,
            activity_type_id: 0,  
            activity_type_category_id: request.activity_type_category_id, 
            activity_access_role_id: request.activity_access_role_id || 0,   
            activity_status_id: request.activity_status_id,
            activity_status_type_id: request.activity_status_type_id, // paid
            activity_status_type_category_id: request.activity_status_type_category_id || 0,        
            flag_offline: 0,
            flag_retry: 0,
            message_unique_id: util.getMessageUniqueId(request.asset_id),
            track_latitude: 0.0,
            track_longitude: 0.0,
            track_altitude: 0,
            track_gps_datetime: util.getCurrentUTCTime(),
            track_gps_accuracy: 0.0,
            track_gps_status: 1,
            track_gps_location: '',
            service_version: request.service_version,
            app_version: request.app_version,
            device_os_id: 5,
            datetime_log: util.getCurrentUTCTime(),
            activity_stream_type_id:704,
            timeline_stream_type_id:704,
            //global_array:request.global_array,
            activity_timeline_collection:x
        };
        //logger.info("assignRequest :: ",JSON.stringify(assignRequest, null,2));
        const alterStatusActAsync = nodeUtil.promisify(makingRequest.post);
        //logger.info("assignRequest :: ",JSON.stringify(assignRequest, null,2));
        const makeRequestOptions1 = {
            form: alterStatusRequest
        };
        try {
             //logger.info("makeRequestOptions1 :: ",JSON.stringify(makeRequestOptions1, null,2));
            // global.config.mobileBaseUrl + global.config.version
            const response = await alterStatusActAsync(global.config.mobileBaseUrl + global.config.version + '/activity/status/alter', makeRequestOptions1);
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                logger.info("Activity Status Alter | Body: ", body);
                await addActivity(request)                                              
                return [false, {}];
            }else{
                logger.info("Error ", body);
                return [true, {}];
            }
        } catch (error) {
            logger.info("Activity Status Alter | Error: ", error);
            return [true, {}];
        } 
    }

    ///get/activity/category/type
    this.getActivityType = async (request) => {

        let responseData = [],
            error = true;
    
        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
        )
        const queryString = util.getQueryString('pm_v1_workforce_activity_type_mapping_select_category', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
            .then((data) => {
                responseData = data;
                error = false;
                
            })
            .catch((err) => {
                error = err;
            })
        }
        return [error, responseData];
    

    }

    //get First Status of an activityTypeCategory // /get/activity/category/status
    this.getActivityStatusV1 = async (request) => {

        let responseData = [],
            error = true;
            // IN p_organization_id BIGINT(20), IN p_account_id BIGINT(20), IN p_workforce_id BIGINT(20), IN p_activity_type_category_id SMALLINT(6), IN p_activity_status_type_id SMALLINT(6)

        var paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            request.activity_status_type_id
        )
        const queryString = util.getQueryString('pm_v1_workforce_activity_status_mapping_select_first_status', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
            .then((data) => {
                responseData = data;
                error = false;
            })
            .catch((err) => {
                error = err;
            })
        }
        return [error, responseData];
    }

    const addActivity = async (request) => {

       // const [eventErr, eventData] = await self.getEvent(request);
        request.activity_parent_id = request.reservation_id                                  
       // // eventData[0].activity_id;
       // request.activity_type_category_id = 40;                                             
        const [err1, activityType] = await this.getActivityType(request);
        request.activity_type_id = activityType[0].activity_type_id;
        // request.activity_status_type_id = 115;                                              
        const [err2, activityStatus] = await this.getActivityStatusV1(request);
        request.activity_status_id = activityStatus[0].activity_status_id;
        request.activity_title = request.asset_first_name + (request.table_name||'');
        request.activity_description = request.activity_title;
		request.activity_access_role_id=121;
		request.activity_channel_category_id= 0;
		request.activity_channel_id=0;
		request.activity_datetime_end=util.addUnitsToDateTime(util.getCurrentISTTime(),2,"hours");
		request.activity_datetime_start=util.getCurrentISTTime(); 
        request.owner_asset_id=request.asset_id;
		request.activity_form_id=0;
		request.activity_inline_data=JSON.stringify([{"total_amount": request.amount, "refunded_amount": request.refund_amount, "remaining_amount":request.remaining_amount}]);              // added activity_inline_data for payment
		request.activity_sub_type_id=0
		request.activity_sub_type_name=''
		request.app_version=1
		request.asset_message_counter=0
		request.channel_activity_categeory_id=0
		request.device_os_id=5;
		request.flag_offline=0;
		request.flag_pin=0;
		request.flag_priority=0
		request.flag_retry=0
		request.message_unique_id=util.getMessageUniqueId(request.asset_id)	
		request.product_id=2
		request.service_version=1
		request.track_altitude=0
		request.track_gps_accuracy=0
		request.track_gps_datetime=util.getCurrentUTCTime()
		request.track_gps_location=''
		request.track_gps_status=1
		request.track_latitude=0
		request.track_longitude=0
		request.member_code = '0' 
        request.url = '/activity/add';

        const assignActAsync = nodeUtil.promisify(makingRequest.post);
        const makeRequestOptions1 = {
            form: request,
        };
        try {
            const response = await assignActAsync(
                global.config.mobileBaseUrl + global.config.version + "/activity/add",
                makeRequestOptions1,
            );
            const body = JSON.parse(response.body);
            if (Number(body.status) === 200) {
                console.log("Activity Add | Body: ", body);
                return [false, body];
            } else {
                console.log("Error ", body);
                return [true, {}];
            }
        } catch (error) {
            console.log("Activity Add | Error: ", error);
            return [true, {}];
        }
    };

}

module.exports = MerchantPaymentService;