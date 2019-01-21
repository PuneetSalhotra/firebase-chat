/* 
 * author: A Sri Sai Venkatesh
 */

var UtilityController = require('../controllers/utilityController');
var ActivityConfigController = require('../controllers/activityConfigController');
var ActivityController = require('../controllers/activityController');
var ActivityParticipantController = require('../controllers/activityParticipantController');
var ActivityUpdateController = require('../controllers/activityUpdateController');
var ActivityListingController = require('../controllers/activityListingController');
var AssetController = require('../controllers/assetController');
var AssetConfigController = require('../controllers/assetConfigController');
var ActivityTimelineController = require('../controllers/activityTimelineController');
var FormConfigController = require('../controllers/formConfigController');
var WidgetController = require('../controllers/widgetController');
var AccountController = require('../controllers/accountController');
var LogController = require('../controllers/logController'); //BETA
var PamController = require('../controllers/pamController'); //PAM
var PerformanceStatsController = require('../controllers/performanceStatsController');
var PamListingController = require('../controllers/pamListingController'); //PAM
var zohoController = require('../controllers/zohoController');
var PamUpdateController = require('../controllers/pamUpdateController');
//var FormConfigController = require('../controllers/formConfigController');
//var FormDataController = require('../controllers/formDataController');
//var LinkController = require('../controllers/linkController');
//var GroupController = require('../controllers/groupController');
//var FormExceptionController = require('../controllers/formExceptionController');

//Vodafone
var VodafoneController = require('../vodafone/controllers/vodafoneController');
var BotController = require('../botEngine/controllers/botController');
const WorkflowQueueController = require('../workflowQueue/controllers/workflowQueueController.js');
///////////////////////////////////////////////////////////////////////

// Stats
var StatsController = require('../controllers/statsController');

function ControlInterceptor(objCollection) {
    
    new UtilityController(objCollection);    
    new ActivityConfigController(objCollection);
    new ActivityController(objCollection);
    new ActivityParticipantController(objCollection);
    new ActivityUpdateController(objCollection);
    new ActivityListingController(objCollection);    
    new AssetController(objCollection);
    new AssetConfigController(objCollection);
    new ActivityTimelineController(objCollection);
    new FormConfigController(objCollection);
    new WidgetController(objCollection);
    new AccountController(objCollection);
    new LogController(objCollection);
    new PamController(objCollection);
    new PerformanceStatsController(objCollection);
    new PamListingController(objCollection);
    new zohoController(objCollection);
    new PamUpdateController(objCollection);
    //new FormConfigController(app, log, cacheWrapper, queueWrapper);
    //new FormDataController(app, log, cacheWrapper, queueWrapper);
    //new LinkController(app, log, cacheWrapper, queueWrapper);
    //new GroupController(app, log, cacheWrapper, queueWrapper);
    //new FormExceptionController(app, log, cacheWrapper, queueWrapper);

    // Stats
    new StatsController(objCollection);
    
    //Vodafone
    new VodafoneController(objCollection);
    new BotController(objCollection);
    new WorkflowQueueController(objCollection);
    ////////////////////////////////

}
;
module.exports = ControlInterceptor;
