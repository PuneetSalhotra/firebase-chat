/*
 * author: Nani Kalyan V
 */
var makeRequest = require('request');
var https = require('https');

function OtherService(objectCollection) {

    var db = objectCollection.db;
    var util = objectCollection.util;
    var activityCommonService = objectCollection.activityCommonService;

    
    this.meetingDurationInsert = async function(request) {
      
        let responseData = [],
            error = true;

        const paramsArr = [
          request.duration_name,
          request.duration_value,
          request.duration_description,
          request.duration_level_id,
          request.activity_type_id,
          request.workforce_id,
          request.account_id,
          request.organization_id,
          request.log_asset_id,
          util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_p1_meeting_duration_list_insert', paramsArr);
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
    };

    this.meetingDurationDelete = async function(request) {
      
        let responseData = [],
            error = true;

        const paramsArr = [
          request.organization_id,
          request.duration_id,
          request.log_asset_id,
          util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_p1_meeting_duration_list_delete', paramsArr);
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
    };
    
    this.meetingDurationList = async function(request) {
      
        let responseData = [],
            error = true;

        const paramsArr = [
          request.organization_id,
          request.account_id,
          request.workforce_id,
          request.activity_type_id,
          request.flag,
          request.start_from,
          request.limit_value
        ];

        const queryString = util.getQueryString('ds_p1_meeting_duration_list_select', paramsArr);
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
    };
}
;

module.exports = OtherService;

