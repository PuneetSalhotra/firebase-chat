const ActivityTimelineService = require("../../services/activityTimelineService.js");

function DrsService(objectCollection) {  
  const db = objectCollection.db;  
  const util = objectCollection.util;  

  const activityTimelineService = new ActivityTimelineService(objectCollection);

  this.sampleFunc = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.inline_data || '{}',
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                  responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
  }

}
module.exports = DrsService;
