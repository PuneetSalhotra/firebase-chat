/* 
 * author: Sri Sai Venkatesh
 */
const pubnubWrapper = new (require('../utils/pubnubWrapper'))(); //BETA

function ActivityPushService() {
    var getPushString = function (request, objectCollection, senderName, callback) {
        var pushString = {};
        var extraData = {};
        var msg = {}; //Pubnub Push String
        msg.type = 'activity_unread';
        msg.activity_type_category_id = 0;
        
        var activityTypeCategoryId = Number(request.activity_type_category_id);        
        objectCollection.activityCommonService.getActivityDetails(request, 0, function (err, activityData) {
            if (err === false) {
                var activityTitle = activityData[0]['activity_title'];
                var activityInlineJson = JSON.parse(activityData[0]['activity_inline_data']);
                switch (activityTypeCategoryId) {
                    case 1: //Task List                        
                        break;
                    case 2: // Notepad
                        break;
                    case 4: // Employee ID Card
                        break;
                    case 5: // Co-worker Contact Card
                        break;
                    case 6: // External Contact Card - Customer
                    case 29:    //External Contact Card - Supplier
                        switch (request.url) {
                            case '/0.1/activity/timeline/entry/add':
                                break;
                            case '/0.1/activity/status/alter':
                                break;
                            case '/0.1/activity/participant/access/set':
                                var activityInlineJson = JSON.parse(activityData[0]['activity_inline_data']);
                                var contactName = activityInlineJson.contact_first_name + ' ' + activityInlineJson.contact_last_name;
                                pushString.title = senderName;
                                pushString.description = contactName + ' ' + 'has beed shared as a Contact';
                                break;
                        }
                        ;
                        break;
                    case 8: // Mail
                        switch (request.url) {
                            case '/0.1/activity/timeline/entry/add':
                                break;
                            case '/0.1/activity/status/alter':
                                break;
                            case '/0.1/activity/participant/access/set':
                                msg.activity_type_category_id = 8;
                                pushString.title = senderName;
                                pushString.description = 'Mail: ' + activityTitle;
                                break;
                        }
                        ;
                        break;
                    case 9: // Form
                        switch (request.url) {
                            case '/0.1/activity/timeline/entry/add':
                                break;
                            case '/0.1/activity/status/alter':
                                break;
                            case '/0.1/activity/participant/access/set':
                                msg.activity_type_category_id = 9;
                                pushString.title = senderName;
                                pushString.description = 'Form has been shared for approval';
                                break;
                        }
                        ;
                        break;
                    case 10:    // Folders
                        msg.activity_type_category_id = 10;
                        switch (request.url) {
                            case '/0.1/activity/add':                                
                                pushString.title = senderName;
                                pushString.description = 'made you the owner of: '+ activityTitle;
                                break;
                            case '/0.1/activity/timeline/entry/add':
                                pushString.title = senderName;
                                pushString.description = 'Has added an update to - ' + activityTitle;
                                break;
                            case '/0.1/activity/status/alter':
                                msg.activity_type_category_id = 0;
                                break;
                            case '/0.1/activity/owner/alter':
                                pushString.title = senderName;
                                pushString.description = 'Folder: ' + activityTitle + ' owner is changed';
                                break;
                            case '/0.1/activity/participant/access/set':
                                pushString.title = senderName;
                                pushString.description = 'Folder: ' + activityTitle + ' has been shared to collaborate';
                                break;
                        }
                        ;
                        break;
                    case 11:    // Project
                        switch (request.url) {
                            case '/0.1/activity/timeline/entry/add':
                                break;
                            case '/0.1/activity/status/alter':
                                break;
                            case '/0.1/activity/participant/access/set':
                                msg.activity_type_category_id = 11;
                                pushString.title = senderName;
                                pushString.description = 'Project: ' + activityTitle + ' has been shared to collaborate';
                                break;
                        }
                        ;
                        break;
                    case 14:    // Voice Call
                        switch (request.url) {
                            case '/0.1/activity/timeline/entry/add':
                                break;
                            case '/0.1/activity/status/alter':
                                break;
                            case '/0.1/activity/participant/access/set':
                                pushString.title = "Audio call";
                                pushString.description = 'Call from ' + activityInlineJson.owner_details.operating_asset_first_name;
                                extraData.type = 1;
                                extraData.call_data = {
                                    meeting_id:activityInlineJson.meeting_id,
                                    caller_asset_id: activityInlineJson.owner_details.asset_id,
                                    caller_name: senderName,
                                    activity_id: request.activity_id
                                };
                                pushString.extra_data = extraData;
                                break;
                        }
                        ;
                        break;
                    case 15:    // Video Conference
                        switch (request.url) {
                            case '/0.1/activity/cover/alter':
                                pushString.title = senderName;
                                pushString.description = 'Meeting details has been updated for ' + activityTitle;
                                break;
                            case '/0.1/activity/status/alter':
                                break;
                            case '/0.1/activity/participant/access/set':
                                //console.log('activityInlineJson : ', activityInlineJson)
                                pushString.title = "Video call";
                                //pushString.description = 'Meeting: ' + activityTitle + ' has been scheduled at ' + (activityData[0]['activity_datetime_start_expected']);
                                pushString.description = 'Video Call from ' + activityInlineJson.owner_details.operating_asset_first_name;
                                extraData.type = 2;
                                extraData.call_data = {
                                    meeting_id:activityInlineJson.meeting_id,
                                    caller_asset_id: activityInlineJson.owner_details.asset_id,
                                    caller_name: senderName,
                                    activity_id: request.activity_id
                                };
                                pushString.extra_data = extraData;
                                break;
                        }
                        ;
                        break;
                    case 28:    // Remainder
                        switch (request.url) {
                            case '/0.1/activity/timeline/entry/add':
                                break;
                            case '/0.1/activity/status/alter':
                                break;
                            case '/0.1/activity/participant/access/set':
                                msg.activity_type_category_id = 28;
                                pushString.title = senderName;
                                pushString.description = activityData[0]['activity_description'].substring(0, 100);
                                break;
                        }
                        ;
                        break;
                    case 31:    //Calendar Event
                        switch (request.url) {
                            case '/0.1/activity/timeline/entry/add':
                                break;
                            case '/0.1/activity/status/alter':
                                break;
                            case '/0.1/activity/participant/access/set':
                                pushString.title = senderName;
                                pushString.description = 'Shared an Event to you - ' + activityTitle;
                                break;
                        }
                        ;
                        break;
                    case 32:    //Customer Request
                        break;
                    case 33:    //Visitor Request
                        break;
                    case 34:    //Time Card
                        break;
                }
                ;
                callback(false, pushString, msg);
            } else {
                callback(true, {},msg);
            }
        });
    };

    var getAssetBadgeCount = function (request, objectCollection, assetId, organizationId, callback) {
        var paramsArr = new Array(
                organizationId,
                assetId
                );
        var queryString = objectCollection.util.getQueryString('ds_v1_activity_asset_mapping_select_unread_task_count', paramsArr);
        if (queryString != '') {
            objectCollection.db.executeQuery(1, queryString, request, function (err, data) {
                if (err === false) {
                    callback(false, data[0]['badge_count']);
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, 0);
                }
            });
        }
    };

    this.sendPush = function (request, objectCollection, pushAssetId, callback) {
        var proceedSendPush = function (pushReceivers, senderName) {            
           if (pushReceivers.length > 0) {
               getPushString(request, objectCollection, senderName, function (err, pushStringObj, pubnubMsg) {
                    if (Object.keys(pushStringObj).length > 0) {
                        objectCollection.forEachAsync(pushReceivers, function (next, rowData) {
                            objectCollection.cacheWrapper.getAssetMap(rowData.assetId, function (err, assetMap) {
                                console.log(rowData.assetId, ' is asset for which we are about to send push');
                                //console.log('Asset Map : ', assetMap);
                                global.logger.write('debug', rowData.assetId + ' is asset for which we are about to send push',{},request);
                                if (Object.keys(assetMap).length > 0) {
                                    getAssetBadgeCount(request, objectCollection, assetMap.asset_id, assetMap.organization_id, function (err, badgeCount) {
                                        console.log(badgeCount, ' is badge count obtained from db');
                                        console.log(pushStringObj, objectCollection.util.replaceOne(badgeCount), assetMap.asset_push_arn);
                                        global.logger.write('debug', badgeCount + ' is badge count obtained from db', {},request)
                                        global.logger.write('debug', pushStringObj + objectCollection.util.replaceOne(badgeCount) + assetMap.asset_push_arn, {},request)
                                        switch(rowData.pushType) {
                                            case 'pub':console.log('pubnubMsg :', pubnubMsg); 
                                                       if(pubnubMsg.activity_type_category_id != 0) {
                                                            pubnubMsg.organization_id = rowData.organizationId;
                                                            pubnubMsg.desk_asset_id = rowData.assetId;
                                                            console.log('PubNub Message : ', pubnubMsg);
                                                            pubnubWrapper.push(rowData.organizationId,pubnubMsg);
                                                        }
                                                        //break;
                                            case 'sns': objectCollection.sns.publish(pushStringObj, objectCollection.util.replaceOne(badgeCount), assetMap.asset_push_arn);
                                                        break;
                                        }                                        
                                    }.bind(this));
                                } else if(rowData.pushType == 'pub') {
                                    if(pubnubMsg.activity_type_category_id != 0) {
                                                            pubnubMsg.organization_id = rowData.organizationId;
                                                            pubnubMsg.desk_asset_id = rowData.assetId
                                                            console.log('PubNub Message : ', pubnubMsg);
                                                            pubnubWrapper.push(rowData.organizationId,pubnubMsg);
                                                        }
                                } 
                            });
                            next();
                        }).then(function () {
                            callback(false, true);
                        });
                    } else {
                        //console.log('push string is retrived as an empty object');
                        global.logger.write('debug','push string is retrived as an empty object', {},request)
                        callback(false, true);
                    }
                }.bind(this));
            }
        }

        var pushReceivers = new Array();
        objectCollection.activityCommonService.getAllParticipants(request, function (err, participantsList) {
            if (err === false) {
                var senderName = '';
                var reqobj = {};
                if (pushAssetId > 0) {
                    //console.log('inside add participant case');
                    objectCollection.forEachAsync(participantsList, function (next, rowData) {
                        if (Number(request.asset_id) === Number(rowData['asset_id'])) { // sender details in this condition
                            senderName = rowData['operating_asset_first_name'] + ' ' + rowData['operating_asset_last_name'];
                            next();
                        } else if (Number(pushAssetId) === Number(rowData['asset_id'])) {
                            reqobj = {organization_id: rowData['organization_id'], asset_id: rowData['asset_id']};
                            objectCollection.activityCommonService.getAssetDetails(reqobj, function(err, data, resp){
                                console.log('SESSION DATA : ', data);
                                    if(err === false) {
                                            switch(data) {
                                                case 8: pushReceivers.push({assetId: rowData['asset_id'], organizationId: rowData['organization_id'], pushType:'sns'});
                                                        break;
                                                case 9 :pushReceivers.push({assetId: rowData['asset_id'], organizationId: rowData['organization_id'], pushType:'pub'});
                                                        break;
                                            }
                                     }
                                     next();
                                })                         
                        }              
                    }).then(function () {
                        proceedSendPush(pushReceivers, senderName);
                    });
                } else {
                    objectCollection.forEachAsync(participantsList, function (next, rowData) {
                        if (Number(request.asset_id) !== Number(rowData['asset_id'])) {
                            reqobj = {organization_id: rowData['organization_id'], asset_id: rowData['asset_id']};
                            objectCollection.activityCommonService.getAssetDetails(reqobj, function(err, data, resp){
                                console.log('SESSION DATA : ', data);
                                    if(err === false) {
                                           switch(data) {
                                                case 8: pushReceivers.push({assetId: rowData['asset_id'], organizationId: rowData['organization_id'], pushType:'sns'});
                                                        break;
                                                case 9 :pushReceivers.push({assetId: rowData['asset_id'], organizationId: rowData['organization_id'], pushType:'pub'});
                                                        break;
                                            }                                
                                        }
                                     next();
                                })
                        } else {
                            senderName = rowData['operating_asset_first_name'] + ' ' + rowData['operating_asset_last_name'];
                            next();
                        }                            
                    }).then(function () {
                        proceedSendPush(pushReceivers, senderName);
                    });
                }
            }
        });
    };
}
;
module.exports = ActivityPushService;
