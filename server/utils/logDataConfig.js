/* 
 * author: Sri Sai Venkatesh
 */

var serviceIdUrlMapping = {
    "/0.1/asset/passcode/alter": 1,
    "/0.1/asset/passcode/check": 2,
    "/0.1/asset/link/set": 3,
    "/0.1/workforce/asset_type/list": 4,
    "/0.1/workforce/activity_type/list": 5,
    "/0.1/workforce/activity_participant_access/list": 6,
    "/0.1/workforce/activity_status/list": 7,
    "/0.1/activity/access/asset/list": 8,
    "/0.1/activity/add": 9,
    "/0.1/activity/inline/collection": 10,
    "/0.1/activity/inline/alter": 11,
    "/0.1/activity/participant/access/set": 12,
    "/0.1/activity/participant/access/reset": 13,
    "/0.1/activity/coworker/access/organization/list": 14,
    "/0.1/activity/coworker/access/orgnization/search": 15,
    "/0.1/activity/contact/access/asset/search": 16,
    "/0.1/asset/add": 17,
    "/0.1/activity/timeline/entry/add": 18,
    "/0.1/activity/status/alter": 19,
    "/0.1/activity/mail/access/asset/search": 20,
    "/0.1/asset/inline/collection": 21
};

var logLevel = {
    request: 1,
    response: 2,
    debug: 3,
    warning: 4,
    trace: 5,
    appError: 6,
    serverError: 7,
    fatal: 8
};

var sourceMap = {
    0: "NA",
    1: "android",
    2: "IOS",
    3: "windows",
    4: "web",
    5: "portal",
    6: "reporting server"
};


module.exports = {
    serviceIdUrlMapping: serviceIdUrlMapping,
    logLevel: logLevel,
    sourceMap: sourceMap
};