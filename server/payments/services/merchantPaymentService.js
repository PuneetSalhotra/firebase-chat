"use strict";

const RazorPaymentGatewayService = require('./razorpayGatewayService');
const PayUPaymentGatewayService = require('./payuGatewayService');
const PayPhiPaymentGatewayService = require('./payPhiGatewayService');
const PaymentUtil = require('../utils/paymentUtil');
const logger = require('../../logger/winstonLogger');
const moment = require('moment');
let makingRequest = require('request');
const nodeUtil = require('util');
const tinyURL = require('tinyurl');
function MerchantPaymentService(objectCollection) {

    let db = objectCollection.db;
    const util = objectCollection.util;
    const activityCommonService = objectCollection.activityCommonService;
    const paymentUtil = new PaymentUtil(objectCollection);
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

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

                let hashText = "";
                if (request.account_id !== undefined) {
                    hashText = request.account_id;
                }
                hashText = hashText + request.amount;
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
                if (request.organization_id !== undefined) {
                    hashText = hashText + request.organization_id;
                }
                if(request.original_merchant_txn_ref_no !== undefined) {
                    hashText = hashText + request.original_merchant_txn_ref_no;
                }
                if (request.reservation_id !== undefined) {
                    hashText = hashText + request.reservation_id;
                }
                if (request.workforce_id !== undefined) {
                    hashText = hashText + request.workforce_id;
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
                    reservation_id: request.reservation_id,
                    account_id: request.account_id,
                    organization_id: request.organization_id,
                    workforce_id: request.workforce_id,
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
        
        let context = {};
        //Step 2: Check if the merchant_id is valid
        if(paymentUtil.isNotEmpty(request.merchant_id)) {
            
            let [err, responseData] = await this.getPrePaymentDetails(request, context);
            if (!err) {
                context = responseData;
                let merchantData = context.merchantData;

                //get merchant secretKey
                let secretKey = merchantData.merchant_secret_key;
                secretKey = Buffer.from(secretKey, 'base64').toString();

                //prepare hashText for validating signature
                let hashText = request.account_id + request.amount + request.currency + request.customer_mobile_no + request.description
                    + request.merchant_id + request.merchant_txn_ref_no + request.organization_id + request.reservation_id + request.workforce_id + secretKey;
                logger.debug("hashText =" + hashText);

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
                                
                                //Step 6: generate new order at PaymentGateway server.

                                let gatewayInstance = this.getPaymentGatewayInstance(context.gatewayData.protocol_type, objectCollection);
                                if (gatewayInstance == null) {
                                    return [true, {
                                        errormsg: "payment gateway not attached to organization = " + request.organization_id
                                    }];
                                } else {
                                    context.paymentTransactionData = {};
                                    let [err, contextData] = await gatewayInstance.createOrder(request, context);
                                    if (!err) {
                                        context = contextData;
                                        let order_id = contextData.paymentTransactionData.auth_no;
                                        let options = contextData.options;
                                        //Step 7: add new payment transaction into system corresponding merchant_id and merchant_txn_ref_no
                                        let [err, data] = await this.addPaymentTransaction(request, request.merchant_id, request.merchant_txn_ref_no, order_id, context);
                                        if (!err) {
                                            logger.info("transaction inserted for merchant_id = " + request.merchant_id
                                                + " merchant_txn_ref_no = " + request.merchant_txn_ref_no);

                                            //Step 8: send response back to web.
                                            logger.info("gatewayInstance : createOrder | response = " + JSON.stringify(options));
                                            return [false, options];
                                        } else {
                                            logger.error("addPaymentTransaction| Error: ", JSON.stringify(data));
                                            return [true, data];
                                        }
                                    } else {
                                        logger.error("gatewayInstance : createOrder| Error: ", JSON.stringify(options));
                                        return [true, options];
                                    }
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
        logger.info("MerchantPaymentService : handlePaymentResponse : request : " + JSON.stringify(request));
        request.current_date = util.getCurrentUTCTime();
        let responseData = {},
            error = false;
        if (paymentUtil.isNotEmpty(request.mihpayid)) {
            //PayU Payment Gateway
            return [error, responseData] = await this.handlePayUPaymentResponse(request);
        } else if(request.addlParam2 == "PayPhi") {

            return [error, responseData] = await this.handlePayPhiPaymentResponse(request);

        } else {
            return [true, {
                errormsg: 'Invaild parameter `mihpayid`'
            }];
        }
    }

    //API 4 :handlePaymentResponseThroughWebhook
    this.handlePaymentResponseThroughWebhook = async function (request) {
        logger.info("MerchantPaymentService : handlePaymentResponseThroughWebhook : request : " + JSON.stringify(request));
        let responseData = {},
            error = false;

        if (paymentUtil.isNotEmpty(request.mihpayid)) {
            //PayU Payment Gateway
            return [error, responseData] = await this.handlePayUPaymentResponse(request);
        } else if(request.addlParam2 == "PayPhi") {
            
            return [error, responseData] = await this.handlePayPhiPaymentResponse(request);

        } else {
            return [error, responseData] = await this.handleRazorPayPaymentResponse(request);
        }

    }

    this.handlePayUPaymentResponse = async function (request) {
        logger.info("MerchantPaymentService : handlePayUPaymentResponse : request : " + JSON.stringify(request));
        request.current_date = util.getCurrentUTCTime();
        let responseData = {},
            error = false;

        if (!paymentUtil.isNotEmpty(request.mihpayid)) {
            logger.error('handlePayUPaymentResponse | Invaild parameter `mihpayid`');
            return [true, {
                errormsg: 'Invaild parameter `mihpayid`'
            }];
        }

        if (!paymentUtil.isNotEmpty(request.txnid)) {
            logger.error('handlePayUPaymentResponse | Invaild parameter `txnid`');
            return [true, { 
                errormsg: 'Invaild parameter `txnid`'
            }];
        }

        if (!paymentUtil.isNotEmpty(request.udf1)) {
            logger.error('handlePayUPaymentResponse | Invaild parameter `udf1`');
            return [true, { 
                errormsg: 'Invaild parameter `udf1`'
            }];
        }

        if (!paymentUtil.isNotEmpty(request.udf2)) {
            logger.error('handlePayUPaymentResponse | Invaild parameter `udf2`');
            return [true, {
                errormsg: 'Invaild parameter `udf2`'
            }];
        }

        if (paymentUtil.isNotEmpty(request.udf1)) {
            request.merchant_id = request.udf1;
            request.merchant_txn_ref_no = request.txnid;
            return [error, responseData] = await this.handlePaymentGatewayResponse(request);
        } else {
            logger.error('handlePayUPaymentResponse | Missing parameter `udf1`');
            return [true, {
                errormsg: 'Missing parameter `udf1`'
            }];
        }
    }

    this.handlePayPhiPaymentResponse = async function (request) {
        logger.info("MerchantPaymentService : handlePayPhiPaymentResponse : request : " + JSON.stringify(request));
        request.current_date = util.getCurrentUTCTime();
        let responseData = {},
            error = false;

        if (!paymentUtil.isNotEmpty(request.addlParam1)) {
            logger.error('handlePayPhiPaymentResponse | Invaild parameter `addlParam1`');
            return [true, {
                errormsg: 'Invaild parameter `addlParam1`'
            }];
        }

        if (!paymentUtil.isNotEmpty(request.merchantTxnNo)) {
            logger.error('handlePayPhiPaymentResponse | Invaild parameter `merchantTxnNo`');
            return [true, { 
                errormsg: 'Invaild parameter `merchantTxnNo`'
            }];
        }

        if (!paymentUtil.isNotEmpty(request.merchantId)) {
            logger.error('handlePayPhiPaymentResponse | Invaild parameter `merchantId`');
            return [true, { 
                errormsg: 'Invaild parameter `merchantId`'
            }];
        }


        if (paymentUtil.isNotEmpty(request.addlParam1)) {
            request.merchant_id = request.addlParam1;
            request.merchant_txn_ref_no = request.merchantTxnNo;
            request.udf1 = request.addlParam1;
            request.txnid = request.merchantTxnNo;
            request.mihpayid = request.txnID;
            return [error, responseData] = await this.handlePaymentGatewayResponse(request);
        } else {
            logger.error('handlePayPhiPaymentResponse | Missing parameter `addlParam1`');
            return [true, {
                errormsg: 'Missing parameter `addlParam1`'
            }];
        }
    }

    this.handlePaymentGatewayResponse = async function (request) {
        logger.debug("handlePaymentGatewayResponse :");
        let context = {};
        let [err, responseData] = await this.getPrePaymentDetails(request, context);
        if (!err) {
            context = responseData;
            let merchantData = context.merchantData;

            //Step 1: find payment_log_transaction using merchant_id and razorpay_order_id
            let [err, paymentTransactionData] = await this.getPaymentTransaction(request, request.udf1, request.txnid);
            if (!err) {
                if (paymentTransactionData.length !== 0) {

                    paymentTransactionData = paymentTransactionData[0];

                    if (!(paymentTransactionData.merchant_id === request.udf1 && paymentTransactionData.merchant_txn_ref_no === request.txnid)) {
                        logger.error('handlePaymentGatewayResponse | Invalid response : Invalid parameters `udf1`|`txnid`');
                        return [true, {
                            errormsg: 'Invalid response : Invalid parameters `udf1`|`txnid`'
                        }];
                    }
                    paymentTransactionData.auth_no = request.mihpayid;
                    context.paymentTransactionData = paymentTransactionData;
                    let payment_status = paymentTransactionData.payment_status;
                    if (payment_status === 'SUC' || payment_status === 'FAI') {

                        //Step 2: send duplicate response
                        let finalResponse = {
                            merchant_id: paymentTransactionData.merchant_id,
                            merchant_txn_ref_no: paymentTransactionData.merchant_txn_ref_no,
                            amount: paymentTransactionData.amount,
                            paymentDateTime: moment(paymentTransactionData.acq_resp_date_time).utc().format("YYYY-MM-DD HH:mm:ss"),
                            authorization_code: paymentTransactionData.auth_id,
                            pg_ref_no: paymentTransactionData.auth_no,
                            transaction_id: paymentTransactionData.transaction_id,
                            payment_response_code: paymentTransactionData.response_code,
                            payment_response_desc: paymentTransactionData.response_desc,
                            reservation_activity_id: paymentTransactionData.reservation_activity_id,
                            organization_id: paymentTransactionData.organization_id,
                            account_id: paymentTransactionData.account_id,
                            workforce_id: paymentTransactionData.workforce_id
                        };
                        logger.error('handlePaymentGatewayResponse | Duplicate response : Payment status = ' + payment_status);
                        logger.info("handlePaymentGatewayResponse | sending back existing payment response = ");
                        logger.info(JSON.stringify(finalResponse));
                        return [false, finalResponse];
                    } else {

                        //Step 2: find payment_order_list 
                        let [err, paymentOrderData] = await this.getPaymentOrder(request, request.udf1, request.txnid);
                        if (!err) {
                            if (paymentOrderData.length !== 0) {

                                paymentOrderData = paymentOrderData[0];
                                let order_status = paymentOrderData.order_status;

                                if (order_status === 'SUC' || order_status === 'FAI') {

                                    //Step 3: send duplicate response
                                    let finalResponse = {
                                        merchant_id: paymentTransactionData.merchant_id,
                                        merchant_txn_ref_no: paymentTransactionData.merchant_txn_ref_no,
                                        amount: paymentTransactionData.amount,
                                        paymentDateTime: moment(paymentTransactionData.acq_resp_date_time).utc().format("YYYY-MM-DD HH:mm:ss"),
                                        authorization_code: paymentTransactionData.auth_id,
                                        pg_ref_no: paymentTransactionData.auth_no,
                                        transaction_id: paymentTransactionData.transaction_id,
                                        payment_response_code: paymentTransactionData.response_code,
                                        payment_response_desc: paymentTransactionData.response_desc,
                                        reservation_activity_id: paymentTransactionData.reservation_activity_id,
                                        organization_id: paymentTransactionData.organization_id,
                                        account_id: paymentTransactionData.account_id,
                                        workforce_id: paymentTransactionData.workforce_id
                                    };

                                    logger.error('handlePaymentGatewayResponse | Duplicate response : Payment status = ' + payment_status);
                                    logger.info("handlePaymentGatewayResponse | sending back existing payment response = ");
                                    logger.info(JSON.stringify(finalResponse));
                                    return [false, finalResponse];
                                } else {
                                    //Get Payment Gateway Instance
                                    let gatewayInstance = this.getPaymentGatewayInstance(context.gatewayData.protocol_type, objectCollection);
                                    if (gatewayInstance == null) {
                                        logger.info("handlePaymentGatewayResponse | payment gateway not attached to merchantId = " + request.udf1);
                                        return [true, {
                                            errormsg: "payment gateway not attached to merchantId = " + request.udf1
                                        }];
                                    } else {
                                        let isValidResponse = false;
                                        if ("PayU" === context.gatewayData.protocol_type || context.gatewayData.protocol_type == 'PayPhi') {
                                            if (gatewayInstance.verifyResponseHash(request, context)) {
                                                logger.info("handlePaymentGatewayResponse | payment gateway not attached to merchantId = " + request.udf1);
                                                return [true, {
                                                    errormsg: "Invalid Hash : merchantId = " + request.udf1
                                                }];
                                            } else {
                                                isValidResponse = true;
                                            }
                                        } else {
                                            isValidResponse = true;
                                        }

                                        if (isValidResponse) {
                                            console.log("isValidResponse final code ", isValidResponse);
                                            //Step 3: fetch the order details using orderId.
                                            let [err, paymentresponse] = await gatewayInstance.fetchPaymentByUsingPaymentId(request, context);
                                            console.log("paymentresponse. ", JSON.stringify(paymentresponse));
                                            if (!err) {
                                                if (paymentresponse.paymentTransactionData.payment_status === "REQ") {
                                                    //Pending status
                                                    let finalResponse = {
                                                        merchant_id: request.merchant_id,
                                                        merchant_txn_ref_no: request.merchant_txn_ref_no,
                                                        pg_ref_no: paymentresponse.paymentTransactionData.auth_no,
                                                        transaction_id: paymentresponse.paymentTransactionData.transaction_id,
                                                        response_code: "000",
                                                        payment_response_code: "21",
                                                        payment_response_desc: "PENDING",
                                                        reservation_activity_id: paymentresponse.paymentTransactionData.reservation_activity_id,
                                                        organization_id: paymentresponse.paymentTransactionData.organization_id,
                                                        account_id: paymentresponse.paymentTransactionData.account_id,
                                                        workforce_id: paymentresponse.paymentTransactionData.workforce_id
                                                    };
                                                    logger.info("handlePaymentResponse | finalResponse = ");
                                                    logger.info(JSON.stringify(finalResponse));
                                                    return [false, finalResponse];
                                                } else {
                                                    try {
                                                        //handle payment SUC or FAI response.
                                                        let transaction_id = paymentresponse.paymentTransactionData.transaction_id;
                                                        logger.debug("transaction_id = " + transaction_id);
                                                        

                                                        let [err, paymentTransaction] = await this.updatePaymentTransaction(request, request.merchant_id, request.merchant_txn_ref_no, paymentresponse.paymentTransactionData);
                                                        if (!err) {
                                                            let [err, paymentOrder] = await this.updatePaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no, paymentresponse.paymentTransactionData, transaction_id);
                                                            if (!err) {

                                                                let payment_datetime = moment(paymentresponse.paymentTransactionData.acq_resp_date_time).utc().format("YYYY-MM-DD HH:mm:ss");

                                                                let finalResponse = {
                                                                    merchant_id: paymentresponse.paymentTransactionData.merchant_id,
                                                                    merchant_txn_ref_no: paymentresponse.paymentTransactionData.merchant_txn_ref_no,
                                                                    amount: paymentresponse.paymentTransactionData.amount.toFixed(2),
                                                                    paymentDateTime: payment_datetime,
                                                                    authorization_code: paymentresponse.paymentTransactionData.str_fld_2,
                                                                    bank_ref_no: paymentresponse.paymentTransactionData.auth_id,
                                                                    pg_ref_no: paymentresponse.paymentTransactionData.auth_no,
                                                                    transaction_id: paymentresponse.paymentTransactionData.transaction_id,
                                                                    response_code: paymentresponse.paymentTransactionData.response_code,
                                                                    payment_response_code: paymentresponse.paymentTransactionData.response_code,
                                                                    payment_response_desc: paymentresponse.paymentTransactionData.response_desc,
                                                                    reservation_activity_id: paymentresponse.paymentTransactionData.reservation_activity_id,
                                                                    organization_id: paymentresponse.paymentTransactionData.organization_id,
                                                                    account_id: paymentresponse.paymentTransactionData.account_id,
                                                                    workforce_id: paymentresponse.paymentTransactionData.workforce_id
                                                                };

                                                                logger.info("handlePaymentGatewayResponse | payment response = ");
                                                                logger.info(JSON.stringify(finalResponse));

                                                                //-------------------------
                                                                request.activity_id = paymentresponse.paymentTransactionData.reservation_activity_id;
                                                                request.organization_id = paymentresponse.paymentTransactionData.organization_id;
                                                                request.account_id = paymentresponse.paymentTransactionData.account_id;
                                                                request.workforce_id = paymentresponse.paymentTransactionData.workforce_id;
                                                                request.activity_type_category_id = 37;
                                                                request.asset_id = 11031
                                                                if ("SUC" === paymentresponse.paymentTransactionData.payment_status) {
                                                                    request.activity_status_type_id = 99;  // paid  
                                                                    let AssetDetails = await this.pamGetAssetDetails(request, request.organization_id, request.asset_id);
                                                                    console.log(AssetDetails[0].asset_encryption_token_id, 'AssetDetailsAssetDetailsAssetDetails');
                                                                    let orderlink = {
                                                                        organizationId: request.organization_id,
                                                                        activity_type_category_id: 38,
                                                                        parent_activity_id: request.activity_id,
                                                                        asset_id: request.asset_id,
                                                                        asset_token_auth: AssetDetails[0].asset_encryption_token_id
                                                                    }
                                                                    orderlink = Buffer.from(JSON.stringify(orderlink)).toString('base64');
                                                                    let link = global.config.ordertracklink + orderlink;                                                            
                                                                    request.long_url = link;
                                                                    tinyURL.shorten(request.long_url, async function (res, err) {
                                                                        if (err) {
                                                                            console.log("getShortFirebaseURL " + err)
                                                                        } else {
                                                                            console.log("getShortFirebaseURL " + res);
                                                                            let PhoneNumber = paymentresponse.paymentTransactionData.customer_mob_no;
                                                                            let restaurant_Name=context.merchantData.merchant_display_name;
                                                                            let CountryCode = 91;
                                                                            let recipientData = {
                                                                                name: CountryCode.toString() + PhoneNumber,
                                                                                phone: CountryCode.toString() + PhoneNumber,

                                                                            };
                                                                            let memberData = {
                                                                                member_name: CountryCode.toString() + PhoneNumber,
                                                                                restaurant_name:restaurant_Name,
                                                                                link: res
                                                                            };
                                                                            let templateName = "orderstatus";
                                                                            let [error, data] = await util.WhatsappNotification(request, memberData, recipientData, templateName);
                                                                            return [true, {}]
                                                                        }
                                                                    });

                                                                } else {
                                                                    request.activity_status_type_id = 191; // payment failed
                                                                }
                                                                this.alterStatusMakeRequest(request);
                                                                //-------------------------

                                                                return [false, finalResponse];
                                                            } else {
                                                                logger.error("handlePaymentGatewayResponse| updatePaymentOrder | Error: ", err);
                                                                return [true, err];
                                                            }
                                                        } else {
                                                            logger.error("handlePaymentGatewayResponse| updatePaymentTransaction | Error: ", err);
                                                            return [true, err];
                                                        }
                                                    } catch (error) {
                                                        logger.error(error);
                                                    }
                                                }
                                            } else {
                                                logger.error("handlePaymentGatewayResponse| fetchPaymentByUsingPaymentId | Error: ", err);
                                                return [true, paymentresponse];
                                            }
                                        }
                                    }
                                }
                            } else {
                                logger.error('handlePaymentResponse | Invaild parameter `merchant_id` | `merchant_txn_ref_no`');
                                return [true, {
                                    errormsg: 'Invaild parameter `merchant_id` | `merchant_txn_ref_no`'
                                }];
                            }
                        } else {
                            logger.error(err);
                            return [true, err];
                        }
                    }
                } else {
                    logger.error("handlePaymentGatewayResponse | getPaymentTransactionUsingOrderId| Error: ", err);
                    return [true, {
                        errormsg: 'Invaild parameter `razorpay_order_id`'
                    }];
                }
            } else {
                logger.error("handlePaymentGatewayResponse | getPaymentTransactionUsingOrderId| Error: ", err);
                return [true, err];
            }
        } else {
            logger.error("handlePaymentGatewayResponse| getPrePaymentDetails| Error: ", JSON.stringify(responseData));
            return [true, responseData];
        }
    }

    this.handleRazorPayPaymentResponse = async function (request) {
        logger.debug("handleRazorPayPaymentResponse=>");
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
                        
            //request.activity_status_type_id = 99;
            //request.activity_type_category_id = 37;
            //await this.alterStatusMakeRequest(request)
            return await this.handleRazorPayWebhookRefundResponse(request);
        } else {
            return await this.handleRazorPayWebhookPaymentResponse(request);
        }
    }

    this.handleRazorPayWebhookPaymentResponse = async function (request) {
        logger.info("MerchantPaymentService : handlePaymentResponseThroughWebhook : request : "  +  JSON.stringify(request));
        let razorpayMerchantId = global.config.razorpayMerchantId;
        
        let razorpay_payment_id = null;
        let razorpay_order_id = null;
        let context = {};
        let request_payload = request;
        
        let request_entity = {};
        if(request_payload.hasOwnProperty("payload")) {
            let payload = request_payload.payload;
            if(payload.hasOwnProperty("payment")) {
                let payment = payload.payment;
                if(payment.hasOwnProperty("entity")) {
                    request_entity = payment.entity;
                    if(request_entity === {}) {
                        logger.error('handlePaymentResponse webhook| Invalid payment response | Invalid parameter `entity`');
                        return [true, { 
                            errormsg : 'Invalid payment response | Missing parameter `entity`'
                        }];
                    }
                }
            }
        }
        
        request.current_date = util.getCurrentUTCTime();
        if(!paymentUtil.isNotEmpty(razorpayMerchantId)) {
            logger.error('handlePaymentResponse webhook| Please configure `razorpayMerchantId` in globalConfig.js file');
            return [true, { 
                errormsg : 'Internal Server Error'
            }];
        } else {
            if(!paymentUtil.isNotEmpty(request_payload.account_id)) {
                logger.error('handlePaymentResponse webhook | Invalid payment response | Missing parameter `account_id`');
                return [true, { 
                    errormsg : 'Invalid payment response | Missing parameter `account_id`'
                }];
            } else {
                if(razorpayMerchantId !== request_payload.account_id.substring(4, request_payload.account_id.length)) {
                    logger.error('handlePaymentResponse webhook| Invalid payment response | Invalid parameter `account_id`');
                    return [true, { 
                        errormsg : 'Invalid payment response | Invalid parameter `account_id`'
                    }];
                }
            }
        }
        
        if(!paymentUtil.isNotEmpty(request_entity.id)) {
            logger.error('handlePaymentResponse webhook| Invaild parameter `razorpay_payment_id`');
            return [true, { 
                errormsg : 'Invaild parameter `razorpay_payment_id`'
            }];
        } else {
            razorpay_payment_id = request_entity.id;
        }

        if(!paymentUtil.isNotEmpty(request_entity.id)) {
            logger.error('handlePaymentResponse webhook| Invaild parameter `razorpay_payment_id`');
            return [true, { 
                errormsg : 'Invaild parameter `razorpay_payment_id`'
            }];
        } else {
            razorpay_payment_id = request_entity.id;
        }

        if(!paymentUtil.isNotEmpty(request_entity.order_id)) {
            logger.error('handlePaymentResponse webhook| Invaild parameter `razorpay_order_id`');
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
                paymentTransactionData.auth_id = razorpay_payment_id;
                context.paymentTransactionData = paymentTransactionData;
                let payment_status = paymentTransactionData.payment_status;
                if ((payment_status === 'SUC' || payment_status === 'FAI') && "WEBHOOK" === paymentTransactionData.str_fld_1) {
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

                        let [err, responseData] = await this.getPrePaymentDetails(request, context);
                        if (!err) {
                            context = responseData;
                            let merchantData = context.merchantData;

                            let gatewayInstance = this.getPaymentGatewayInstance(context.gatewayData.protocol_type, objectCollection);
                            if (gatewayInstance == null) {
                                return [true, {
                                    errormsg: "payment gateway not attached to organization = " + request.organization_id
                                }];
                            } else {
                                //Step 3: fetch the order details using razorpay_order_id.
                                let [err, paymentresponse] = await gatewayInstance.fetchPaymentByUsingPaymentId(request, context);
                                if (!err) {

                                    let transaction_id = paymentresponse.paymentTransactionData.transaction_id;
                                    logger.debug("transaction_id = " + transaction_id);

                                    //-------------------------
                                    request.activity_id = paymentresponse.paymentTransactionData.reservation_activity_id;
                                    request.organization_id = paymentresponse.paymentTransactionData.organization_id;
                                    request.account_id = paymentresponse.paymentTransactionData.account_id;
                                    request.workforce_id = paymentresponse.paymentTransactionData.workforce_id;
                                    request.activity_type_category_id = 37;
                                    request.asset_id = 11031;
                                    if ("SUC" === paymentresponse.paymentTransactionData.payment_status) {
                                        request.activity_status_type_id = 99;  // paid
                                        request.is_pam = true;
                                    } else {
                                        request.activity_status_type_id = 191; // payment failed
                                        request.is_pam = false;
                                    }
                                    this.alterStatusMakeRequest(request);
                                    if (request.is_pam) {
                                        await sleep(1000);
                                        request.access_role_id = 2;
                                        request.message = "Order Received";
                                        activityCommonService.sendPushOnReservationAdd(request);
                                    }
                                    //-------------------------
                                    let [err, paymentTransaction] = await this.updatePaymentTransaction(request, request.merchant_id, request.merchant_txn_ref_no, paymentresponse.paymentTransactionData);
                                    if (!err) {

                                        if ("SUC" === paymentOrderData.order_status || "FAI" === paymentOrderData.order_status) {
                                            let order_status = 'FAI';
                                            let response_code = "39";
                                            let response_description = 'FAILED';
                                            request.isSuccess = false;
                                            if ("SUC" === paymentresponse.paymentTransactionData.payment_status) {
                                                order_status = 'SUC';
                                                response_code = "00";
                                                response_description = "SUCCESS";
                                                request.isSuccess = true
                                            }

                                            let payment_datetime = moment(paymentresponse.paymentTransactionData.acq_resp_date_time).utc().format("YYYY-MM-DD HH:mm:ss");

                                            let finalResponse = {
                                                merchant_id: paymentresponse.paymentTransactionData.merchant_id,
                                                merchant_txn_ref_no: paymentresponse.paymentTransactionData.merchant_txn_ref_no,
                                                amount: paymentresponse.paymentTransactionData.amount.toFixed(2),
                                                paymentDateTime: payment_datetime,
                                                authorization_code: paymentresponse.paymentTransactionData.str_fld_2,
                                                bank_ref_no: paymentresponse.paymentTransactionData.auth_id,
                                                pg_ref_no: paymentresponse.paymentTransactionData.auth_no,
                                                transaction_id: paymentresponse.paymentTransactionData.transaction_id,
                                                response_code: "00",
                                                payment_response_code: paymentresponse.paymentTransactionData.response_code,
                                                payment_response_desc: paymentresponse.paymentTransactionData.response_desc
                                            };
                                            logger.info("handlePaymentResponse webhook| finalResponse = ");
                                            logger.info(JSON.stringify(finalResponse));
                                            return [false, finalResponse];
                                        } else {
                                            let [err, paymentOrder] = await this.updatePaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no, paymentresponse.paymentTransactionData, transaction_id);
                                            if (!err) {
                                                let payment_datetime = moment(paymentresponse.paymentTransactionData.acq_resp_date_time).utc().format("YYYY-MM-DD HH:mm:ss");

                                                let finalResponse = {
                                                    merchant_id: paymentresponse.paymentTransactionData.merchant_id,
                                                    merchant_txn_ref_no: paymentresponse.paymentTransactionData.merchant_txn_ref_no,
                                                    amount: paymentresponse.paymentTransactionData.amount.toFixed(2),
                                                    paymentDateTime: payment_datetime,
                                                    authorization_code: paymentresponse.paymentTransactionData.str_fld_2,
                                                    bank_ref_no: paymentresponse.paymentTransactionData.auth_id,
                                                    pg_ref_no: paymentresponse.paymentTransactionData.auth_no,
                                                    transaction_id: paymentresponse.paymentTransactionData.transaction_id,
                                                    response_code: "00",
                                                    payment_response_code: paymentresponse.paymentTransactionData.response_code,
                                                    payment_response_desc: paymentresponse.paymentTransactionData.response_desc
                                                };
                                                logger.info("finalResponse = ");
                                                logger.info(JSON.stringify(finalResponse));
                                                return [false, finalResponse];
                                            } else {
                                                logger.error("handlePaymentResponse webhook| updatePaymentOrder | Error: ", err);
                                                return [true, err];
                                            }
                                        }
                                    } else {
                                        logger.error("handlePaymentResponse webhook| updatePaymentTransaction | Error: ", err);
                                        return [true, err];
                                    }
                                } else {
                                    logger.error("handlePaymentResponse webhook| fetchPaymentByUsingPaymentId | Error: ", err);
                                    return [true, err];
                                }
                            }
                        } else {
                            logger.error('handlePaymentResponse webhook | getPrePaymentDetails');
                            return [true, responseData];
                        }
                    } else {
                        logger.error('handlePaymentResponse webhook | Invaild parameter `merchant_id` | `merchant_txn_ref_no`');
                        return [true, { 
                            errormsg : 'Invaild parameter `merchant_id` | `merchant_txn_ref_no`'
                        }];
                    }
                } else {
                    logger.error(err);
                    return [true, err];
                }
            } else {
                logger.error("handlePaymentResponse webhook | getPaymentTransactionUsingOrderId| Error: ", err);
                return [true, { 
                    errormsg : 'Invaild parameter `razorpay_order_id`'
                }];
            }
        } else {
            logger.error("handlePaymentResponse webhook | getPaymentTransactionUsingOrderId| Error: ", err);
            return [true, err];
        }
    }

    this.handleRazorPayWebhookRefundResponse = async function (request) {
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
                let [err, refund] = await gatewayInstance.fetchRefundByUsingRefundId(razorpay_payment_id, razorpay_refund_id);
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

                                request.activity_id = paymentTransactionData.reservation_activity_id;
                                request.organization_id = paymentTransactionData.organization_id;
                                request.account_id = paymentTransactionData.account_id;
                                request.workforce_id = paymentTransactionData.workforce_id;
                                request.activity_type_category_id = 37;
                                request.asset_id = 11031;
                                if ("processed" === refund.status) {
                                    refund_status = 'SUC';
                                    refund_resp_code = "00";
                                    refund_resp_desc = "Refund Processed";
                                    request.activity_status_type_id = 192;  // paid                             
                                } else {
                                    request.activity_status_type_id = 194; // payment failed
                                }
                                this.alterStatusMakeRequest(request);

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
                                    paymentTransactionData.transaction_id,
                                    paymentTransactionData.workforce_id,
                                    paymentTransactionData.account_id,
                                    paymentTransactionData.organization_id,
                                    paymentTransactionData.reservation_activity_id
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
    this.statusCheck = async function (request) {
        logger.info("MerchantPaymentService : statusCheck : request : " + JSON.stringify(request));
        let context = {};

        if (!paymentUtil.isNotEmpty(request.merchant_id)) {
            logger.error('Invaild parameter `merchant_id`');
            return [true, {
                errormsg: 'Invaild parameter `merchant_id`'
            }];
        }

        if (!paymentUtil.isNotEmpty(request.merchant_txn_ref_no)) {
            logger.error('Invaild parameter `merchant_txn_ref_no`');
            return [true, {
                errormsg: 'Invaild parameter `merchant_txn_ref_no`'
            }];
        }

        if (paymentUtil.isNotEmpty(request.merchant_id)) {

            let [err, responseData] = await this.getMerchant(request, request.merchant_id);
            if (!err) {
                context.merchantData = responseData;

                //Step 1: find order details using merchant_id and merchant_txn_ref_no
                let [err, paymentOrderData] = await this.getPaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no);
                if (!err) {
                    if (paymentOrderData.length !== 0) {

                        paymentOrderData = paymentOrderData[0];
                        context.paymentOrderData = paymentOrderData;

                        //Step 2: find payment_log_transaction using merchant_id and merchant_txn_ref_no
                        let [err, paymentTransactionData] = await this.getPaymentTransaction(request, request.merchant_id, request.merchant_txn_ref_no);
                        if (!err) {

                            if (paymentTransactionData.length !== 0) {

                                paymentTransactionData = paymentTransactionData[0];
                                context.paymentTransactionData = paymentTransactionData;

                                let payment_status = paymentTransactionData.payment_status;
                                let razorpay_order_id = paymentTransactionData.auth_no;

                                if (payment_status === 'SUC' || payment_status === 'FAI') {

                                    //Step 2: send duplicate response
                                    let finalResponse = {
                                        merchant_id: paymentTransactionData.merchant_id,
                                        merchant_txn_ref_no: paymentTransactionData.merchant_txn_ref_no,
                                        amount: paymentTransactionData.amount,
                                        paymentDateTime: moment(paymentTransactionData.acq_resp_date_time).utc().format("YYYY-MM-DD HH:mm:ss"),
                                        authorization_code: paymentTransactionData.auth_id,
                                        pg_ref_no: paymentTransactionData.auth_no,
                                        transaction_id: paymentTransactionData.transaction_id,
                                        payment_response_code: paymentTransactionData.response_code,
                                        payment_response_desc: paymentTransactionData.response_desc,
                                        reservation_activity_id: paymentTransactionData.reservation_activity_id,
                                        organization_id: paymentTransactionData.organization_id,
                                        account_id: paymentTransactionData.account_id,
                                        workforce_id: paymentTransactionData.workforce_id
                                    };
                                    logger.error('Duplicate response : Payment status = ' + payment_status);
                                    logger.info("sending back existing payment response = ");
                                    logger.info(JSON.stringify(finalResponse));
                                    return [false, finalResponse];

                                } else {

                                    //Pending Status
                                    let [err, responseData] = await this.getPrePaymentDetailsForStatus(request, context);
                                    if (!err) {
                                        if (responseData === {}) {
                                            return [true, {
                                                errormsg: 'Internal Server Error'
                                            }];
                                        } else {

                                            //Get Payment Gateway Instance
                                            let gatewayInstance = this.getPaymentGatewayInstance(context.gatewayData.protocol_type, objectCollection);
                                            if (gatewayInstance == null) {
                                                return [true, {
                                                    errormsg: "payment gateway not attached to organization = " + request.organization_id
                                                }];
                                            } else {

                                                //Step 3: fetch the order details using orderId.
                                                let [err, paymentresponse] = await gatewayInstance.fetchPaymentsByUsingOrderId(request, context);
                                                logger.debug("----------------------------------");
                                                logger.error(err);
                                                logger.debug("----------------------------------");
                                                if (!err) {

                                                    if (paymentresponse.paymentTransactionData.payment_status === "REQ") {
                                                        //Pending status
                                                        let finalResponse = {
                                                            merchant_id: request.merchant_id,
                                                            merchant_txn_ref_no: request.merchant_txn_ref_no,
                                                            pg_ref_no: paymentresponse.paymentTransactionData.auth_no,
                                                            transaction_id: paymentresponse.paymentTransactionData.transaction_id,
                                                            response_code: "000",
                                                            payment_response_code: "21",
                                                            payment_response_desc: "PENDING",
                                                            reservation_activity_id: paymentresponse.paymentTransactionData.reservation_activity_id,
                                                            organization_id: paymentresponse.paymentTransactionData.organization_id,
                                                            account_id: paymentresponse.paymentTransactionData.account_id,
                                                            workforce_id: paymentresponse.paymentTransactionData.workforce_id
                                                        };
                                                        logger.info("finalResponse = ");
                                                        logger.info(JSON.stringify(finalResponse));
                                                        return [false, finalResponse];
                                                    } else {

                                                        try {
                                                            //handle payment SUC or FAI response.
                                                            let transaction_id = paymentresponse.paymentTransactionData.transaction_id;
                                                            logger.debug("transaction_id = " + transaction_id);

                                                            let [err, paymentTransaction] = await this.updatePaymentTransaction(request, request.merchant_id, request.merchant_txn_ref_no, paymentresponse.paymentTransactionData);
                                                            if (!err) {
                                                                let [err, paymentOrder] = await this.updatePaymentOrder(request, request.merchant_id, request.merchant_txn_ref_no, paymentresponse.paymentTransactionData, transaction_id);
                                                                if (!err) {
                                                                    let payment_datetime = moment(paymentresponse.paymentTransactionData.acq_resp_date_time).utc().format("YYYY-MM-DD HH:mm:ss");

                                                                    let finalResponse = {
                                                                        merchant_id: paymentresponse.paymentTransactionData.merchant_id,
                                                                        merchant_txn_ref_no: paymentresponse.paymentTransactionData.merchant_txn_ref_no,
                                                                        amount: paymentresponse.paymentTransactionData.amount.toFixed(2),
                                                                        paymentDateTime: payment_datetime,
                                                                        authorization_code: paymentresponse.paymentTransactionData.str_fld_2,
                                                                        bank_ref_no: paymentresponse.paymentTransactionData.auth_id,
                                                                        pg_ref_no: paymentresponse.paymentTransactionData.auth_no,
                                                                        transaction_id: paymentresponse.paymentTransactionData.transaction_id,
                                                                        response_code: "000",
                                                                        payment_response_code: paymentresponse.paymentTransactionData.response_code,
                                                                        payment_response_desc: paymentresponse.paymentTransactionData.response_desc,
                                                                        reservation_activity_id: paymentresponse.paymentTransactionData.reservation_activity_id,
                                                                        organization_id: paymentresponse.paymentTransactionData.organization_id,
                                                                        account_id: paymentresponse.paymentTransactionData.account_id,
                                                                        workforce_id: paymentresponse.paymentTransactionData.workforce_id
                                                                    };
                                                                    logger.info("finalResponse = ");
                                                                    logger.info(JSON.stringify(finalResponse));

                                                                    //-------------------------
                                                                    request.activity_id = paymentresponse.paymentTransactionData.reservation_activity_id;
                                                                    request.organization_id = paymentresponse.paymentTransactionData.organization_id;
                                                                    request.account_id = paymentresponse.paymentTransactionData.account_id;
                                                                    request.workforce_id = paymentresponse.paymentTransactionData.workforce_id;
                                                                    request.activity_type_category_id = 37;
                                                                    request.asset_id = 11031;
                                                                    if ("SUC" === paymentresponse.paymentTransactionData.payment_status) {
                                                                        request.activity_status_type_id = 99;  // paid                             
                                                                    } else {
                                                                        request.activity_status_type_id = 191; // payment failed
                                                                    }
                                                                    this.alterStatusMakeRequest(request);
                                                                    //-------------------------

                                                                    return [false, finalResponse];
                                                                } else {
                                                                    logger.error("statusCheck| updatePaymentOrder | Error: ", err);
                                                                    return [true, err];
                                                                }
                                                            } else {
                                                                logger.error("statusCheck| updatePaymentTransaction | Error: ", err);
                                                                return [true, err];
                                                            }
                                                        } catch (error) {
                                                            logger.error(error);
                                                            return [true, {
                                                                errormsg: 'Internal Server Error'
                                                            }];
                                                        }
                                                    }
                                                } else {
                                                    logger.error("statusCheck| fetchPaymentByUsingPaymentId | Error: ", err);
                                                    return [true, paymentresponse];
                                                }
                                            }
                                        }
                                    }

                                }
                            } else {
                                logger.error("statusCheck | getPaymentTransactionUsingOrderId| Error: ", err);
                                return [true, { 
                                    errormsg: 'Invaild parameter `merchant_txn_ref_no`'
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



    //API 8 : Handle Settlement Response.
    this.getSettlementResponse = async function (request) {
        logger.info("MerchantPaymentService : getSettlementResponse : request : " + JSON.stringify(request));
        let context = {};
        let responseData = [],
            error = true;
        let acq_merchant_id = request.merchantId;
        let merchant_id = request.addlParam1;
        let merchant_txn_ref_no = request.merchantTxnNo;

        if (!paymentUtil.isNotEmpty(request.merchantId)) {
            logger.error('Invaild parameter `merchantId`');
            return [true, {
                errormsg: 'Invaild parameter `merchantId`'
            }];
        }

        if (!paymentUtil.isNotEmpty(request.addlParam1)) {
            logger.error('Invaild parameter `addlParam1`');
            return [true, {
                errormsg: 'Invaild parameter `addlParam1`'
            }];
        }

        if (!paymentUtil.isNotEmpty(request.merchantTxnNo)) {
            logger.error('Invaild parameter `merchantTxnNo`');
            return [true, {
                errormsg: 'Invaild parameter `merchantTxnNo`'
            }];
        }

        if (paymentUtil.isNotEmpty(merchant_id)) {

            let [err, responseData] = await this.getMerchant(request, merchant_id);
            if (!err) {
                context.merchantData = responseData;
                request.merchant_id = merchant_id;

                let [err1, paymentLogRes] = await this.getPaymentTransaction(request, merchant_id, merchant_txn_ref_no);
                if (err1 || (paymentLogRes.length === 0)) {
                    logger.error('Invaild request');
                    return [true, {
                        errormsg: 'Invaild request'
                    }];
                }

                paymentLogRes = paymentLogRes[0];

                let [e, responseData1] = await this.getAcquirerDetailsByUsingOrganization(request, context);
                if (e) {
                    logger.error('Invaild request');
                    return [true, {
                        errormsg: 'Invaild request'
                    }];
                }
                let gatewayInstance = this.getPaymentGatewayInstance(context.gatewayData.protocol_type, objectCollection);
                if (gatewayInstance == null) {
                    logger.error('Internal server error');
                    return [true, {
                        errormsg: 'Internal server error'
                    }];
                }
                context = responseData1;

                if (paymentLogRes.payment_status !== 'SUC' && paymentLogRes.amount != paymentLogRes.remaining_amount) {
                    logger.error('Invaild request');
                    return [true, {
                        errormsg: 'Invaild request'
                    }];
                }

                if (acq_merchant_id !== paymentLogRes.acquirer_merchant_id) {
                    logger.error('Invaild parameter `merchantId`');
                    return [true, {
                        errormsg: 'Invaild parameter `merchantId`'
                    }];
                }

                let verifyHash = await gatewayInstance.verifySettlementResponseHash(request, context);

                if (!verifyHash) {
                    logger.error('Invaild parameter `secureHash`');
                    return [true, {
                        errormsg: 'Invaild parameter `secureHash`'
                    }];
                }

                let transaction_type = 'PAYMENT';

                const paramsArr = [
                    1,
                    util.convertDateFormat(request.settlementDate, 'YYYY-MM-DD'),
                    merchant_id,
                    merchant_txn_ref_no,
                    transaction_type,
                    JSON.stringify(request)
                ];
                logger.info(paramsArr);
                const queryString = util.getQueryString('ds_v1_payment_log_transaction_update_settlement_details', paramsArr);
                if (queryString !== '') {
                    await db.executeQueryPromise(1, queryString, request)
                        .then((data) => {
                            responseData = data;
                            logger.info("Settlement handled successfully");
                            error = false;
                        })
                        .catch((err) => {
                            error = err;
                        })
                }
                error = false;
                logger.debug("final settlement response = " + JSON.stringify({
                    merchant_id: merchant_id,
                    merchant_txn_ref_no: merchant_txn_ref_no
                }));
                return [error, {
                    merchant_id: merchant_id,
                    merchant_txn_ref_no: merchant_txn_ref_no
                }];

            } else {
                logger.error("getSettlementResponse | getMerchant| Error: ", JSON.stringify(responseData));
                return [true, responseData];
            }
        } else {
            logger.error('getSettlementResponse | Missing parameter `merchant_id`');
            return [true, {
                errormsg: 'Missing parameter `merchant_id`'
            }];
        }
    }

    //API 6 :Raise new Refund.
    this.createRefund = async function(request) {
        logger.info("MerchantPaymentService : createRefund : request : " + JSON.stringify(request));
        let context = {};
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
                                            context.paymentTransactionData = paymentTransactionData;
                                            let [err, responseData] = await this.getPrePaymentDetailsForStatus(request, context);
                                            if (!err) {
                                                if (responseData === {}) {
                                                    return [true, {
                                                        errormsg: 'Internal Server Error'
                                                    }];
                                                } else {
                                                    //Get Payment Gateway Instance
                                                    let gatewayInstance = this.getPaymentGatewayInstance(context.gatewayData.protocol_type, objectCollection);
                                                    if (gatewayInstance == null) {
                                                        return [true, {
                                                            errormsg: "payment gateway not attached to organization = " + request.organization_id
                                                        }];
                                                    } else {
                                                        //Step 6: initiate a new refund using razorpay_payment_id.
                                                        let [err, paymentContext] = await gatewayInstance.createRefund(request, context);
                                                        if (!err) {
                                                            if (paymentContext.paymentTransactionData.payment_status === "REQ") {
                                                                //Pending status
                                                                let finalResponse = {
                                                                    merchant_id: request.merchant_id,
                                                                    merchant_txn_ref_no: request.merchant_txn_ref_no,
                                                                    original_merchant_txn_ref_no: request.original_merchant_txn_ref_no,
                                                                    pg_ref_no: paymentContext.paymentTransactionData.auth_no,
                                                                    refund_request_id: paymentContext.paymentTransactionData.auth_id,
                                                                    transaction_id: paymentContext.paymentTransactionData.transaction_id,
                                                                    payment_response_code: "000",
                                                                    payment_response_desc: "Refund initiated successfully"
                                                                };
                                                                logger.info("finalResponse = ");
                                                                logger.info(JSON.stringify(finalResponse));
                                                                return [false, finalResponse];
                                                            } else {
                                                                let paymentTransactionData = paymentContext.paymentTransactionData;

                                                                let payment_status = paymentContext.paymentTransactionData.payment_status;
                                                                if(payment_status === 'SUC' && paymentContext.paymentTransactionData.remaining_amount > 0) {
                                                                    
                                                                    let transaction_id = paymentContext.paymentTransactionData.transaction_id;
                                                                    logger.debug("transaction_id = " + transaction_id);
                                                                    
                                                                    let refund_amount = paymentContext.paymentTransactionData.amount;
                                                                    let refund_date_time = moment(new Date()).utc().format("YYYY-MM-DD HH:mm:ss");
                                                                    
                                                                    let refund_status = "FAI";
                                                                    let refund_resp_code = "39";
                                                                    let refund_resp_desc = "Refund Failed";
                                    
                                                                    if("SUC" === paymentContext.paymentTransactionData.payment_status) {
                                                                        refund_status = "SUC";
                                                                        refund_resp_code = "00";
                                                                        refund_resp_desc = "Refund Processed";
                                                                    }
                                    
                                                                    request.activity_id = paymentTransactionData.reservation_activity_id;
                                                                    request.organization_id = paymentTransactionData.organization_id;
                                                                    request.account_id = paymentTransactionData.account_id;
                                                                    request.workforce_id = paymentTransactionData.workforce_id;
                                                                    request.activity_type_category_id = 37;
                                                                    request.asset_id = 11031;
                                                                    if ("SUC" === paymentContext.paymentTransactionData.payment_status) {
                                                                        refund_status = 'SUC';
                                                                        refund_resp_code = "00";
                                                                        refund_resp_desc = "Refund Processed";
                                                                        request.activity_status_type_id = 192;  // paid                             
                                                                    } else {
                                                                        request.activity_status_type_id = 194; // payment failed
                                                                    }
                                                                    this.alterStatusMakeRequest(request);

                                                                    let refund_txn_no = paymentUtil.generateUniqueID();
                                                                    let refund_transaction_id = paymentUtil.generateUniqueID();
                                                                    const refundArray = new Array(
                                                                        refund_transaction_id,
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
                                                                        paymentTransactionData.auth_no,
                                                                        paymentTransactionData.auth_id,
                                                                        paymentTransactionData.acquirer_response_code,
                                                                        null,
                                                                        refund_resp_code,
                                                                        refund_resp_desc,
                                                                        refund_status,
                                                                        paymentTransactionData.acquirer_id,
                                                                        paymentTransactionData.gateway_id,
                                                                        paymentTransactionData.acquirer_merchant_id,
                                                                        0.00,
                                                                        0.00,
                                                                        "Refund",
                                                                        paymentContext.gatewayData.arn || null,
                                                                        paymentTransactionData.auth_no,
                                                                        JSON.stringify(paymentTransactionData.str_fld_4),
                                                                        paymentTransactionData.transaction_id,
                                                                        paymentTransactionData.workforce_id,
                                                                        paymentTransactionData.account_id,
                                                                        paymentTransactionData.organization_id,
                                                                        paymentTransactionData.reservation_activity_id                                                       );
                                    
                                                                    //Step 4: Add refund transaction.
                                                                    let [err, refundTransactionData1] = await this.addRefundTransaction(request, paymentTransactionData.merchant_id, refund_txn_no, refundArray);
                                                                    if (!err) {
                                    
                                                                        //Step 5: Update parent payment transaction.
                                                                        let [err, refundData] = await this.updatePaymentTransactionForRefund(request, transaction_id, refund_amount);
                                                                        if (!err) {
                                                                            logger.info(refund_resp_desc);
                                                                            let finalResponse = {
                                                                                merchant_id: request.merchant_id,
                                                                                original_merchant_txn_ref_no: request.original_merchant_txn_ref_no,
                                                                                pg_ref_no: paymentTransactionData.auth_no,
                                                                                merchant_txn_ref_no: refund_txn_no,
                                                                                transaction_id: refund_transaction_id,
                                                                                response_code: paymentTransactionData.response_code,
                                                                                response_desc: paymentTransactionData.response_desc
                                                                            };
                                                                            logger.info("Refund finalResponse = ");
                                                                            logger.info(JSON.stringify(finalResponse));
                                                                            return [false, finalResponse];
                                                                        } else {
                                                                            logger.error("handlePaymentResponse| updatePaymentTransactionForRefund | Error: ", err);
                                                                            return [true, err];
                                                                        }
                                                                    } else {
                                                                        logger.error("handlePaymentResponse| getPaymentTransactionUsingOrderId | Error: ", err);
                                                                        return [true, err];
                                                                    }
                                                            }
                                                            }
                                                        } else {
                                                            logger.error(err);
                                                            return [true, err];
                                                        }
                                                    }
                                                }
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

    //API 7 :/get/organization/aquirer
    this.getAcquirerMappedToOrganization = async function (request) {
        if (!paymentUtil.isNotEmpty(request.merchant_id)) {
            logger.error('Invaild parameter `merchant_id`');
            return [true, {
                errormsg: 'Invaild parameter `merchant_id`'
            }];
        }
        let context = {};

        //let [error, responseData] = await this.getPrePaymentDetails(request, context);
        let [error, responseData] = await this.getAcquirerDetailsByUsingOrganization(request, context);
        if (!error) {
            if (responseData !== {}) {
                return [false, {
                    organization_id: request.organization_id,
                    merchant_id: request.merchant_id,
                    acquirer_id: responseData.gatewayData.acquirer_id,
                    acquirer_name: responseData.gatewayData.protocol_type
                }];
                return [false, responseData];
            } else {
                return [true, {
                    errormsg: 'Mapping details not available for the organization'
                }];
            }
        } else {
            return [true, {
                errormsg: 'Internal Server Error'
            }];
        }
    }

    // get all information.
    this.getPrePaymentDetails = async function (request, context) {
        let [err, merchantData] = await this.getMerchant(request, request.merchant_id);
        if (!err) {
            if (merchantData.length !== 0) {
                context.merchantData = merchantData;
                let [error, responseData] = await this.getAcquirerDetailsByUsingOrganization(request, context);
                if (!error) {
                    if (responseData !== {}) {
                        context.paymentModeMappingData = responseData.paymentModeMappingData;
                        context.gatewayData = responseData.gatewayData;
                        let [err, merchantParamData] = await this.getMerchantParamDetails(request, request.merchant_id, context.gatewayData.acquirer_id);
                        if (!err) {
                            if (merchantParamData.length !== 0) {
                                context.merchantParamData = merchantParamData[0];
                                return [false, context];
                            } else {
                                return [true, {
                                    errormsg: 'Mapping details not available for the organization'
                                }];
                            }
                        } else {
                            return [true, responseData];
                        }
                    } else {
                        return [true, responseData];
                    }
                } else {
                    return [true, merchantData];
                }
            } else {
                return [true, {
                    errormsg: 'Invalid merchantId'
                }];
            }
        } else {
            return [true, merchantData];
        }
    }

    //For status check
    this.getPrePaymentDetailsForStatus = async function (request, context) {
        let acquirer_id = context.paymentTransactionData.acquirer_id;
        let merchant_id = context.paymentTransactionData.merchant_id;
        let [error, gatewayData] = await this.getPaymentGatewayDetails(request, acquirer_id);
        if (!error) {
            if (gatewayData.length !== 0) {
                context.gatewayData = gatewayData[0];
                let [err, merchantParamData] = await this.getMerchantParamDetails(request, merchant_id, acquirer_id);
                if (!err) {
                    if (merchantParamData.length !== 0) {
                        context.merchantParamData = merchantParamData[0];
                        return [false, context];
                    } else {
                        return [true, {
                            errormsg: 'Mapping details not available for the organization'
                        }];
                    }
                } else {
                    return [true, responseData];
                }
                return [false, context];
            } else {
                return [true, {
                    errormsg: 'Gateway details not available for the organization'
                }];
            }
        } else {
            return [true, {
                errormsg: 'Internal Server Error'
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
            await db.executeQueryPromise(1, queryString, request)
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
            await db.executeQueryPromise(1, queryString, request)
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
            await db.executeQueryPromise(1, queryString, request)
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
            await db.executeQueryPromise(1, queryString, request)
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
            await db.executeQueryPromise(1, queryString, request)
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
    
    this.addPaymentTransaction = async function (request, merchant_id, merchant_txn_ref_no, payment_order_id, context) {
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
            context.gatewayData.gateway_acquirer_id,
            context.gatewayData.gateway_id,
            context.merchantParamData.acqmerchant_id,
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
                    if (request.hasOwnProperty('is_unpaid')) {
                        request.activity_parent_id = request.reservation_id;
                        request.activity_type_category_id = 37;
                        request.amount = 0;
                        console.log('is_unpaid...', request.amount)
                        activityCommonService.updateAmountInInlineData(request);
                    }
                    else {
                        request.activity_parent_id = request.reservation_id;
                        request.activity_type_category_id = 37;
                        let orderAmount = typeof request.amount == 'string' ? request.amount : `"${request.amount}"`;
                        request.amount = orderAmount;
                        console.log(typeof orderAmount, '::::::::paid orders:::::::::::')
                        activityCommonService.updateAmountInInlineData(request);
                    }
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

        console.log(", refundArray", JSON.stringify(refundArray));
        let responseData = {},
            error = true;

        const queryString = util.getQueryString('ds_v1_payment_log_transaction_insert_refund', refundArray);

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

        if ("SUC" === payment.payment_status) {
            order_status = 'SUC';
        }

        const paramsArr = new Array(
            order_status,
            payment.payment_inst_type,
            payment.payment_inst_sub_type,
            payment.transaction_id,
            payment.merchant_id,
            payment.merchant_txn_ref_no
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
            payment.acq_resp_date_time,
            payment.payment_inst_type,
            payment.payment_inst_sub_type || null,
            payment.encrypted_payment_inst_id || null,
            payment.masked_payment_inst_id || null,
            payment.card_network || null,
            payment.auth_no,
            payment.auth_id,
            payment.acquirer_response_code,
            payment.int_error_code || null,
            payment.response_code,
            payment.response_desc,
            payment.payment_status,
            payment.str_fld_1,
            merchant_id,
            merchant_txn_ref_no,
            payment.customer_name || null,
            payment.transaction_charges || 0.00,
            payment.service_tax || 0.00,
            payment.str_fld_2 || null,
            null,
            payment.str_fld_4
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
        let mandatoryParams = ["amount", "currency", "customer_mobile_no", "description", "merchant_id", "merchant_txn_ref_no", "signature",
            "reservation_id", "workforce_id", "account_id", "organization_id"];
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

        const activityStatus = await getActivityStatusId(request);
        request.activity_status_id = activityStatus[0].activity_status_id;              
        const alterStatusRequest = {
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: request.workforce_id,
            asset_id: request.asset_id,
            auth_asset_id:100,
            asset_token_auth: '54188fa0-f904-11e6-b140-abfd0c7973d9',
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
                //await addActivity(request)                                              
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

    //get the active gateway list.
    this.getActiveGatewayList = async function (request) {
        logger.info("MerchantPaymentService : getActiveGatewayList");
        let responseData = {},
            error = true;

        const paramsArr = new Array();
        const queryString = util.getQueryString('ds_p1_acquirer_gateway_mapping_select_status', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : getActiveGatewayList : ds_p1_acquirer_gateway_mapping_select_status : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg: 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }

    //get GatewayDetails.
    this.getPaymentGatewayDetails = async function (request, acquirerId) {
        logger.info("MerchantPaymentService : getPaymentGatewayDetails : Gateway Id " + acquirerId);
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            acquirerId,
            0,
            10
        );
        const queryString = util.getQueryString('ds_p1_acquirer_gateway_mapping_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : getPaymentGatewayDetails : ds_p1_acquirer_gateway_mapping_select : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg: 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }

    //get MerchantParam Details.
    this.getMerchantParamDetails = async function (request, merchantId, acquirerId) {
        logger.info("MerchantPaymentService : getMerchantParamDetails");
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            merchantId,
            acquirerId
        );
        const queryString = util.getQueryString('ds_p1_merchant_acquirer_param_mapping_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : getMerchantParamDetails : ds_p1_merchant_acquirer_param_mapping_select : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg: 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }

    //get Payment Gateway Details.
    this.getPaymentGatewayUsingPaymentMode = async function (request, merchant_id, payment_inst, payment_sub_inst) {
        logger.info("MerchantPaymentService : getPaymentGatewayUsingPaymentMode");
        let responseData = {},
            error = true;

        const paramsArr = new Array(
            merchant_id,
            payment_inst,
            payment_sub_inst
        );
        const queryString = util.getQueryString('ds_p1_merchant_acquirer_payment_mode_mapping_select', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    logger.error("MerchantPaymentService : getPaymentGatewayUsingPaymentMode : ds_p1_merchant_acquirer_payment_mode_mapping_select : Error : " + err);
                    error = true;
                    responseData = {
                        errormsg: 'Internal Server Error'
                    };
                })
        }
        return [error, responseData];
    }

    //Get Acquirer Details By Using Organization
    this.getAcquirerDetailsByUsingOrganization = async function (request, context) {
        let [error, paymentModeMappingData] = await this.getPaymentGatewayUsingPaymentMode(request, request.merchant_id, "*", "*");
        if (!error) {
            if (paymentModeMappingData.length !== 0) {
                context.paymentModeMappingData = paymentModeMappingData[0];
                let [error, gatewayData] = await this.getPaymentGatewayDetails(request, paymentModeMappingData[0].acq_id);
                if (!error) {
                    if (gatewayData.length !== 0) {
                        context.gatewayData = gatewayData[0];
                        return [false, context];
                    } else {
                        return [true, {
                            errormsg: 'Gateway details not available for the organization'
                        }];
                    }
                } else {
                    return [true, {
                        errormsg: 'Internal Server Error'
                    }];
                }
            } else {
                return [true, {
                    errormsg: 'Mapping details not available for the organization'
                }];
            }
        } else {
            return [true, {
                errormsg: 'Internal Server Error'
            }];
        }
    }

    //Get Payment Gateway Instance.
    this.getPaymentGatewayInstance = function (protocol_type, objectCollection) {
        let gatewayInstance = null;
        switch (protocol_type) {
            case "RazorPay": {
                gatewayInstance = new RazorPaymentGatewayService(objectCollection);
            }
                break;
            case "PayPhi": {
                gatewayInstance = new PayPhiPaymentGatewayService(objectCollection);
            }
                break;
            case "PayU":
            default: {
                gatewayInstance = new PayUPaymentGatewayService(objectCollection);
            }
        }
        return gatewayInstance;
    }

    ///get/activity/category/type
    this.getActivityType = async (request) => {

        let responseData = [],
            error = true;
    
        let paramsArr = new Array(
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

        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.activity_type_category_id,
            94
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
    }

    this.getActivityParticipantsCategory = async function (request, activityId) {
        let responseData = [],
            error = true;

        const paramsArr = [
            351,
            452,
            activityId,
            30,
            0,
            0,
            10
        ];

        const queryString = util.getQueryString('pm_v1_activity_asset_mapping_select_participants_category', paramsArr);
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
    this.pamGetAssetDetails = (request, organization_id, asset_id) => {
        return new Promise((resolve, reject) => {
            let paramsArr = new Array(
                organization_id || 351, //,
                asset_id
            );
            let queryString = util.getQueryString('ds_v1_asset_list_select', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, data) {
                    (err === false) ? resolve(data) : reject(err);
                });
            }
        });
    };

    function getActivityStatusId(request) {
        return new Promise((resolve, reject)=>{
            let paramsArr = new Array(
                request.organization_id,
                request.account_id,
                request.workforce_id,
                request.activity_status_type_id
            );
            let queryString = util.getQueryString('ds_v1_workforce_activity_status_mapping_select_status', paramsArr);
            if (queryString != '') {
                db.executeQuery(1, queryString, request, function (err, resp) {
                    if (err === false) {
                        resolve(resp);
                        } else {
                        reject(err);
                    }
                });
            }
        });
    }
}

module.exports = MerchantPaymentService;