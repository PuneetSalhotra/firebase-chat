function StatsService(objCollection) {
    var db = objCollection.db;
    // var cacheWrapper = objCollection.cacheWrapper;
    // var activityCommonService = objCollection.activityCommonService;
    var util = objCollection.util;
    // var forEachAsync = objCollection.forEachAsync;
    // var queueWrapper = objCollection.queueWrapper;
    // var activityPushService = objCollection.activityPushService;
    // var responseactivityData = {}

    this.getSignUpCountStats = function (req, callback) {
        callback(true, false, -123123);
    }
}

module.exports = StatsService;