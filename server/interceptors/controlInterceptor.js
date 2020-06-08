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
let AnalyticsController = require('../analytics/controllers/analyticsController.js');

//Vodafone
var VodafoneController = require('../vodafone/controllers/vodafoneController');
var BotController = require('../botEngine/controllers/botController');
const WorkflowQueueController = require('../workflowQueue/controllers/workflowQueueController.js');
const CommnTemplateController = require('../commnTemplate/controllers/commnTemplateController.js');
const elasticSearchController = require('../elasticSearch/controllers/elasticSearchController')
const docusignController = require('../docusign/controllers/docusignController')
///////////////////////////////////////////////////////////////////////

//  diffbot
var DiffbotController = require('../diffbot/controllers/diffbotController')

// Administrator Services UI
const AdminListingController = require('../Administrator/controllers/adminListingController');
const AdminOpsController = require('../Administrator/controllers/adminOpsController');

// DOA Services
const doaController = require('../Doa/controllers/doaController');

// URL Services
const UrlListingController = require('../UrlShortner/controllers/urlListingController');
const UrlOpsController = require('../UrlShortner/controllers/urlOpsController');

// Ledger Services
const LedgerListingController = require('../Ledgers/controllers/ledgerListingController');
const LedgerOpsController = require('../Ledgers/controllers/ledgerOpsController');

// Stats
var StatsController = require('../controllers/statsController');

// Ledger Services
const WorkbookOpsController_VodafoneCustom = require('../Workbook/controllers/workbookOpsController_VodafoneCustom');

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
    new AnalyticsController(objCollection);

    // Stats
    new StatsController(objCollection);

    // Vodafone
    new VodafoneController(objCollection);
    new BotController(objCollection);
    new WorkflowQueueController(objCollection);
    new CommnTemplateController(objCollection);
    new elasticSearchController(objCollection);
    new docusignController(objCollection);
    ////////////////////////////////

    // diffbot

    new DiffbotController(objCollection);

    // Administrator Services UI
    new AdminListingController(objCollection);
    new AdminOpsController(objCollection);

    // URL Services
    new UrlListingController(objCollection);
    new UrlOpsController(objCollection);

    // Ledger Services
    new LedgerListingController(objCollection);
    new LedgerOpsController(objCollection);

    //DOA services
    new doaController(objCollection);
    
    if (process.env.ENABLE_CUSTOM_EXCEL_BOT) {
        new WorkbookOpsController_VodafoneCustom(objCollection);
    }

}
module.exports = ControlInterceptor;
