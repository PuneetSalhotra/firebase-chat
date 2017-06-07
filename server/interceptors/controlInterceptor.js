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
//var CoworkerController = require('../controllers/coworkerController');
//var FormConfigController = require('../controllers/formConfigController');
//var FormDataController = require('../controllers/formDataController');
//var LinkController = require('../controllers/linkController');
//var GroupController = require('../controllers/groupController');

//var FormExceptionController = require('../controllers/formExceptionController');

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
    //new CoworkerController(app, log, cacheWrapper, queueWrapper);
    //new FormConfigController(app, log, cacheWrapper, queueWrapper);
    //new FormDataController(app, log, cacheWrapper, queueWrapper);
    //new LinkController(app, log, cacheWrapper, queueWrapper);
    //new GroupController(app, log, cacheWrapper, queueWrapper);
    
    //new FormExceptionController(app, log, cacheWrapper, queueWrapper);

}
;
module.exports = ControlInterceptor;
