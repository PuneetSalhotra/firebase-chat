"use strict";

const RazorPaymentGatewayService = require('./razorpayGatewayService');
const PaymentUtil = require('../utils/paymentUtil');
const logger = require('../../logger/winstonLogger');

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

                let hashText = request.amount + request.currency + request.customer_mobile_no + request.description
                    + request.merchant_id + request.merchant_txn_ref_no + secretKey;

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
            return [true, { 
                errormsg : 'Missing parameter `merchant_id`'
            }];
        }
    }

    //API 2 : createOrder
    this.createOrder = async function (request) {
        logger.info("MerchantPaymentService : createOrder: reqeuest : " + JSON.stringify(request));
        let error = false;
        
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
                
                //validate signature
                if(request.signature !== signature) {
                    logger.info("Invalid parameter `signature`");
                    return [true, { 
                        errormsg : "Invalid parameter `signature`"
                    }];
                } else {
                    logger.info("valid parameter `signature`");

                    //check duplicate order
                    let [err, paymentOrderData] = await this.getPaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no);
                    //const [err, data] = await razorPaymentGatewayService.fetchPaymentsByUsingOrderId("order_GqswX5ZTKf2abi");
                    if (!err) {

                        if(paymentOrderData.length == 0) {
                            //add new order
                            request.current_date = util.getCurrentUTCTime();
                            let [errr, order] = await this.addPaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no, merchantData.merchant_secret_key);
                            if (!errr) {
                                logger.info("payment order inserted for merchant_id = " + request.merchant_id
                                        + " merchant_txn_ref_no = " + request.merchant_txn_ref_no);
                                let [err, options] = await razorPaymentGatewayService.createOrder(request, merchantData);
                                if (!err) {
                                    let [err, data] = await this.addPaymentTransaction(request, request.merchant_id, request.merchant_txn_ref_no, options.order_id);
                                    if (!err) {
                                        logger.info("transaction inserted for merchant_id = " + request.merchant_id
                                        + " merchant_txn_ref_no = " + request.merchant_txn_ref_no);
                                        logger.info("final response = " + JSON.stringify(options));
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
        let merchant_txn_ref_no  = request.merchant_txn_ref_no;
        let razorpay_payment_id = null;
        let razorpay_order_id = null;
        let merchant_id = request.merchant_id;
        let razorpay_signature = null;
        let isSuccess = false;
        
        request.current_date = util.getCurrentUTCTime();
        if(request.hasOwnProperty("success_response")) {
            let success_response = JSON.parse(request.success_response);
            razorpay_payment_id = success_response.razorpay_payment_id;
            razorpay_order_id = success_response.razorpay_order_id;
            razorpay_signature = success_response.razorpay_signature;
            isSuccess = true;
        } else if(request.hasOwnProperty("failure_response")) {
            let failure_response = JSON.parse(request.failure_response);
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
                    }
                }
            }
        } else {
            logger.error('Invalid response');
            return [true, { 
                errormsg : 'Invalid response'
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

        if(isSuccess) {

            if(!paymentUtil.isNotEmpty(razorpay_signature)) {
                logger.error('Invaild parameter `signature`');
                return [true, { 
                    errormsg : 'Invaild parameter `signature`'
                }];
            }
            
        }

        //fetch the order details using razorpay_order_id.
        let [err, payment] = await razorPaymentGatewayService.fetchPaymentByUsingPaymentId(razorpay_payment_id);
        if (!err) {
            request.paymentData = payment;

            if(razorpay_order_id !== payment.order_id) {
                logger.error('Invaild parameter `razorpay_order_id`');
                return [true, { 
                    errormsg : 'Invaild parameter `razorpay_order_id`'
                }];
            }

            if(isSuccess) {
                if(!this.validateResponse(razorpay_payment_id, razorpay_order_id, razorpay_signature, razorpayApiKey)) {
                    logger.error('Invaild parameter `signature`');
                    return [true, { 
                        errormsg : 'Invaild parameter `signature`'
                    }];
                }
            }

            let [err, paymentOrderData] = await this.getPaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no);
            if (!err) {
                if(paymentOrderData.length !== 0) {

                    paymentOrderData = paymentOrderData[0];
                    if(paymentOrderData.order_status === "REQ") {

                        let [err, paymentTransactionData] = await this.getPaymentTransaction(request, request.merchant_id, request.merchant_txn_ref_no);
                        if (!err) {
                            if(paymentTransactionData.length !== 0) {

                                paymentTransactionData = paymentTransactionData[0];
                                logger.info("paymentTransactionData");
                                logger.info(JSON.stringify(paymentTransactionData));
                                if(paymentTransactionData.payment_status === "REQ") {
                                    let transaction_id = paymentTransactionData.transaction_id;
                                    logger.debug("transaction_id = " + transaction_id);
                                    let [err, paymentOrder] = await this.updatePaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no, payment, transaction_id);
                                    if (!err) {
                                        
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

                                            let finalResponse = {
                                                merchant_id : request.merchant_id,
                                                merchant_txn_ref_no: request.merchant_txn_ref_no,
                                                amount: paymentOrderData.amount,
                                                paymentDateTime: util.getCurrentUTCTime(),
                                                authorization_code: payment.id,
                                                pg_ref_no: payment.order_id,
                                                transaction_id:transaction_id,
                                                payment_response_code:response_code
                                            };
                                            logger.info("finalResponse = ");
                                            logger.info(JSON.stringify(finalResponse));
                                            return [false, finalResponse];
                                        } else {
                                            logger.error("handlePaymentResponse| Error: ", err);
                                            return [true, { 
                                                errormsg : 'Invaild parameter `razorpay_order_id`'
                                            }];
                                        }
                                    } else {
                                        logger.error("handlePaymentResponse| Error: ", err);
                                        return [true, { 
                                            errormsg : 'Invaild parameter `razorpay_order_id`'
                                        }];
                                    }
                                } else {
                                    let payment_status = paymentTransactionData.payment_status;
                                    if(order_status === 'SUC') {
                                        payment_status = 'already Paid';
                                    }
                                    if(order_status === 'FAI') {
                                        payment_status = 'Payment Failed';
                                    }
                                    logger.error('Duplicate response : Payment status = ' + payment_status);
                                    return [true, { 
                                        errormsg : 'Duplicate response : Payment status = ' + payment_status
                                    }];
                                }
                            }
                        } else {
                            logger.error("handlePaymentResponse| Error: ", err);
                            return [true, { 
                                errormsg : 'Invaild parameter `razorpay_order_id`'
                            }];
                        }
                    } else {

                        let order_status = paymentOrderData.order_status;
                        if(order_status === 'SUC') {
                            order_status = 'already Paid';
                        }
                        if(order_status === 'FAI') {
                            order_status = 'Order Failed';
                        }
                        return [true, { 
                            errormsg : 'Duplicate response : Order status = ' + order_status
                        }];
                    }
                }
            } else {
                logger.error("handlePaymentResponse| Error: ", err);
                return [true, { 
                    errormsg : 'Invaild parameter `razorpay_order_id`'
                }];
            }
        } else {
            logger.error("handlePaymentResponse| Error: ", err);
            return [true, { 
                errormsg : 'Invaild parameter `razorpay_payment_id`'
            }];
        }
    }
    
    

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
                    responseData = data[0];
                    //logger.info("MerchantPaymentService : getMerchant : response = " + JSON.stringify(responseData));
                    if("ACT" === responseData.merchant_status) {
                        error = false;
                    } else {
                        error = true;
                        logger.error("Inactive merchant = " + merchant_id);
                        responseData = {
                            errormsg : "Inactive merchant = " + merchant_id
                        };
                    }
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : getMerchant : merchant_id = " + request.merchant_id + " : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : err
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
                    logger.error("MerchantPaymentService : getMerchant : merchant_id = " + request.merchant_id + " : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : err
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
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : getPaymentTransaction : merchant_id = " + request.merchant_id + " : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : err
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
            request.customer_email_id || null,
            request.response_url || null,
            'PAYMENT',
            request.customer_name || null, 
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
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    error = false;
                    responseData = data;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : addPaymentOrder : merchant_id = " + request.merchant_id + " : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : err
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
            request.countryCode || '',
            request.customer_name || null, 
            request.customer_mobile_no || null,
            null,
            null,
            null,
            payment_order_id,
            request.acquirer_id || '',
            request.gateway_id || '',
            global.config.razorpayMerchantId,
            Number("0.00").toFixed(2),
            Number("0.00").toFixed(2)
            //"REQ"
        );

        console.log(paramsArr);

        const queryString = util.getQueryString('ds_p1_payment_log_transaction_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    error = false;
                    responseData = data;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : addPaymentTransaction : merchant_id = " + merchant_id +
                    " merchant_txn_ref_no = " + merchant_txn_ref_no + " : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : err
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
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    error = false;
                    responseData = data;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : updatePaymentOrder : merchant_id = " + merchant_id +
                    " merchant_txn_ref_no = " + merchant_txn_ref_no + " : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : err
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

        let payment_status = 'FAI';
        let response_code = "39"; 
        let response_description = request.reason || 'FAIELD';
        if("captured" === payment.status) {
            payment_status = 'SUC';
            response_code = "00";
            response_description = "SUCCESS";
        } 
        const paramsArr = new Array(
            util.getCurrentUTCTime(),
            payment.method,
            null,
            null,
            null,
            null,
            payment.order_id,
            payment.id,
            response_code,
            null,
            response_code,
            response_description,
            payment_status,
            null,
            merchant_id,
            merchant_txn_ref_no
        );

        const queryString = util.getQueryString('ds_p1_payment_log_transaction_update', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    error = false;
                    responseData = data;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : updatePaymentTransaction : merchant_id = " + merchant_id +
                    " merchant_txn_ref_no = " + merchant_txn_ref_no + " : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg : err
                    };
                })
        }
        return [error, responseData];
    }

    this.featchOrder = async function (merchantRefNo, razorPayOrderId) {
        logger.info("MerchantPaymentService : featchOrder: reqeuest : " + JSON.stringify(request));
        let responseData = [],
            error = false;

        let [err, data] = await razorPaymentGatewayService.featchOrder(request);
        if (!err) {
            let responseData = {
                options : data,
                organization_id : request.organization_id,
                account_id : request.account_id,
                workforce_id : request.workforce_id,
                asset_id : request.asset_id,
                product_id : request.product_id,
                merchantRefNo : request.merchantRefNo
            };
            logger.info("MerchantPaymentService : createOrder: response : " + JSON.stringify(responseData));
            return [error, responseData];
        } else {
            logger.error("/greneos/api/payment| Error: ", err);
            return [true, err];
        }
    }

    this.validateResponse = function(razorpay_payment_id, razorpay_order_id, signature, razorpayApiKey) {
        
        let hashText = razorpay_order_id + "|" + razorpay_payment_id;

        //let secretKey = global.config.razorpayApiKey;

        let isValidResponse = paymentUtil.isValidHmacSha256(hashText, signature , razorpayApiKey);

        logger.info("isValidResponse = " + isValidResponse);
        return isValidResponse;
    }

    this.validatePaymentRequest = function(reqeust) {
        let mandatoryParams = ["amount", "currency", "customer_mobile_no", "description", "merchant_id", "merchant_txn_ref_no"];
        let result = paymentUtil.isParameterExists(mandatoryParams, request);
        if('Ok' !== result) {
            return result;
        }
        if(!this.isNumber(request.amount)) {
            return 'Invalid parameter `amount`';
        } 
        return 'Ok';
    }
}

module.exports = MerchantPaymentService;