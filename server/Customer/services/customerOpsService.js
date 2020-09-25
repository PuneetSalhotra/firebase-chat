const CustomerListingService = require("../services/customerListingService");
const logger = require('../../logger/winstonLogger');
const fs = require('fs');

function CustomerOpsService(objectCollection) {

  const util = objectCollection.util;
  const db = objectCollection.db;
  const activityCommonService = objectCollection.activityCommonService;
  const customerListingService = new CustomerListingService(objectCollection);
  const moment = require('moment');
  const makeRequest = require('request');
  const nodeUtil = require('util');
  const self = this;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  this.assetSlotTransactionSelect = async function (request) {
    // IN p_organization_id BIGINT(20), IN p_asset_id BIGINT(20),
    // IN p_flag BIGINT(20), IN p_start_datetime DATETIME,
    // IN p_end_datetime DATETIME, IN p_start_from INT(11),
    // IN p_limit_value TINYINT(4)
    let responseData = [],
        error = true;

    const paramsArr = new Array(
      request.organization_id,
      request.asset_id,
      request.flag,
      request.start_datetime,
      request.end_datetime,
      request.start_from,
      request.limit_value
    );
    const queryString = util.getQueryString('ds_p1_asset_slot_transaction_select', paramsArr);

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

  this.assetSlotTransactionInsert = async function (request) {
    // IN p_activity_id BIGINT(20), IN p_asset_id BIGINT(20),
    // IN p_datetime_start DATETIME, IN p_datetime_end DATETIME
    let responseData = [],
        error = true;

    const paramsArr = new Array(
      request.activity_id,
      request.asset_id,
      request.datetime_start,
      request.datetime_end
    );
    const queryString = util.getQueryString('ds_p1_asset_slot_transaction_insert', paramsArr);

    if (queryString !== '') {
      await db.executeQueryPromise(0, queryString, request)
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

  this.assetSlotTransactionUpdateDatetimes = async function (request) {
    // IN p_activity_id BIGINT(20), IN p_organization_id BIGINT(20),
    // IN p_datetime_start DATETIME, IN p_datetime_end DATETIME,
    // IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
    let responseData = [],
        error = true;

    const paramsArr = new Array(
      request.activity_id,
      request.organization_id,
      request.datetime_start,
      request.datetime_end,
      request.auth_asset_id || request.asset_id,
      util.getCurrentUTCTime()
    );
    const queryString = util.getQueryString('ds_v1_asset_slot_transaction_update_datetimes', paramsArr);

    if (queryString !== '') {
      await db.executeQueryPromise(0, queryString, request)
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


  this.assetSlotTransactionUpdate = async function (request) {
    // IN p_activity_id BIGINT(20), IN p_organization_id BIGINT(20),
    // IN p_log_state TINYINT(4), IN p_log_datetime DATETIME
    let responseData = [],
        error = true;

    const paramsArr = new Array(
      request.activity_id,
      request.organization_id,
      request.log_state,
      util.getCurrentUTCTime()
    );
    const queryString = util.getQueryString('ds_p1_asset_slot_transaction_update', paramsArr);

    if (queryString !== '') {
      await db.executeQueryPromise(0, queryString, request)
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
}

module.exports = CustomerOpsService;