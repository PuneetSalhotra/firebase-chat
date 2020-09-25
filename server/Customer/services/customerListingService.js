const AdminListingService = require("../../Administrator/services/adminListingService");
const CustomerUtils = require("../utils/utils")

function CustomerListingService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;
    const moment = require('moment');
    const nodeUtil = require('util');
    const self = this;

    const adminListingService = new AdminListingService(objectCollection);
    const customerUtils = new CustomerUtils()

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    this.fetchNearestFieldExecutive = async function (request) {

        let workforceID = 5755;
        if (Number(request.organization_id) === 909) {
            workforceID = 5755;
        } else if (Number(request.organization_id) === 915) {
            workforceID = 5718;
        }
        // fe => Field Executive
        const [errOne, feData] = await adminListingService.assetListSelectAllDesks({
            organization_id: request.organization_id,
            account_id: request.account_id,
            workforce_id: workforceID
        });

        // Store for nearest executive
        let nearestFieldExecutive = [], shortestDistance = Number.POSITIVE_INFINITY;

        // Calculate distances
        const distances = feData.map(fe => {
            const origin = { latitude: fe.asset_work_location_latitude, longitude: fe.asset_work_location_longitude };
            const destination = { latitude: request.customer_latitude, longitude: request.customer_longitude };
            const distance = customerUtils.getFieldExecutiveDistance(origin, destination).metres;
            console.log("fe: ", fe.asset_id);
            console.log("distance: ", distance);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestFieldExecutive = [{
                    ...customerUtils.filterFieldExecutiveAssetData(fe)
                }];
            }

            return {
                distance,
                ...customerUtils.filterFieldExecutiveAssetData(fe)
            }
        });

        return [false, nearestFieldExecutive];
    }

    this.getFieldExecutiveBookedTimeslotActivities = async function (request) {
        const [err, activityData] = await activityListSelectAssetLeadTasks({
            ...request,
            asset_id: request.lead_asset_id,
            flag: 1 // List
        });
        return [err, activityData];
    }

    async function activityListSelectAssetLeadTasks(request) {
        // IN p_organization_id BIGINT(20), IN p_asset_id BIGINT(20),
        // IN p_flag BIGINT(20), IN p_start_datetime DATETIME, IN p_end_datetime DATETIME,
        // IN p_start_from INT(11), IN p_limit_value TINYINT(4)
        // p_flag - 0 Count
        // p_flag - 1 List

        let responseData = [],
            error = true;

        const paramsArr = new Array(
          request.organization_id,
          request.asset_id,
          request.flag,
          request.start_datetime,
          request.end_datetime,
          request.start_from || 0,
          request.limit_value || 50
        );
        const queryString = util.getQueryString('ds_p1_activity_list_select_asset_lead_tasks', paramsArr);

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

}

module.exports = CustomerListingService;