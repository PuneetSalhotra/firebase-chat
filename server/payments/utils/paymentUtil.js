"use strict";

const logger = require('../../logger/winstonLogger');
const uuidv4 = require('uuid/v4');
const crypto = require('crypto');

function PaymentUtil(objectCollection) {
    
    this.sha256InHEX = function (data) {
        logger.info("sha256InHEX :- ");
        var hexData = crypto.createHash('sha256').update(data, 'utf8').digest('hex').toLowerCase();
        logger.info("hexData = " + hexData);
        return hexData;
    }

    this.generateUniqueID = function() {
        return uuidv4();
    }

    this.hmacSha256 = function(data, key) {
        logger.info("hmacSha256 :- ");
        var hashValue = crypto.createHmac('sha256', key).update(data, "utf-8").digest('hex');
        return hashValue;
    }

    this.isValidHmacSha256 = function(data, hashValue, key) {
        logger.info("isValidHmacSha256 :- ");
        var newHashValue = crypto.createHmac('sha256', key).update(data, "utf-8").digest('hex');
        logger.info("hashValue    = " + hashValue);
        logger.info("newHashValue = " + newHashValue);
        var isValid = (hashValue === newHashValue) ? true : false;
        logger.info("isValid = " + isValid);
        return isValid;    
    }

    this.sha512InHEX = function (data) {
        var hexData = crypto.createHash('sha512').update(data, 'utf8').digest('hex').toLowerCase();
        logger.info("hashValue = " + hexData);
        return hexData;
    }

    this.isNumber = function (data) {
        return data !== undefined && data !== null && (!isNaN(Number(data)));
    }

    this.isNotEmpty = function(data) {
        return data !== undefined && data !== null && data !== "";
    }

    this.isNonNullObject = function (input) {
        return !!input && (typeof input === "undefined" ? "undefined" : _typeof(input)) === "object" && !Array.isArray(input);
    }
   
    this.isParameterExists = function(paramArray, request) {
        for(let i = 0; i < paramArray.length; i++) {
            if(request.hasOwnProperty(paramArray[i])) {
                if(this.isNotEmpty(request[paramArray[i]])) {
                } else {
                    return 'invalid parameter `' + paramArray[i] + '`';    
                }
            } else {
                return 'missing parameter `' + paramArray[i] + '`';
            }
        }
        return 'Ok';
    }
}

module.exports = PaymentUtil;