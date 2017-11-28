/* 
 * author: Sri Sai Venkatesh
 */

function ActivityPushService() {
    var getPushString = function (request, objectCollection, senderName, callback) {
        var pushString = {};
        var activityTypeCategoryId = Number(request.activity_type_category_id);
        objectCollection.activityCommonService.getActivityDetails(request, 0, function (err, activityData) {
            if (err === false) {
                var activityTitle = activityData[0]['activity_title'];
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
                                pushString.title = senderName;
                                pushString.description = 'Form has been shared for approval';
                                break;
                        }
                        ;
                        break;
                    case 10:    // Folders                        
                        switch (request.url) {
                            case '/0.1/activity/timeline/entry/add':
                                pushString.title = senderName;
                                pushString.description = 'Has added an update to - ' + activityTitle;
                                break;
                            case '/0.1/activity/status/alter':
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
                                pushString.title = senderName;
                                pushString.description = 'You missed a call at ' + objectCollection.util.getFormatedLogTime(activityData[0]['activity_datetime_start_expected']);
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
                                pushString.title = senderName;
                                pushString.description = 'Meeting: ' + activityTitle + ' has been scheduled at ' + (activityData[0]['activity_datetime_start_expected']);
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
                callback(false, pushString);
            } else {
                callback(true, {});
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
                getPushString(request, objectCollection, senderName, function (err, pushStringObj) {
                    if (Object.keys(pushStringObj).length > 0) {
                        objectCollection.forEachAsync(pushReceivers, function (next, rowData) {
                            objectCollection.cacheWrapper.getAssetMap(rowData.assetId, function (err, assetMap) {
                                //console.log(rowData.assetId, ' is asset for which we are about to send push');
                                global.logger.write('debug', rowData.assetId + ' is asset for which we are about to send push', request)
                                if (Object.keys(assetMap).length > 0) {
                                    getAssetBadgeCount(request, objectCollection, assetMap.asset_id, assetMap.organization_id, function (err, badgeCount) {
                                        //console.log(badgeCount, ' is badge count obtained from db');
                                        //console.log(pushStringObj, objectCollection.util.replaceOne(badgeCount), assetMap.asset_push_arn);
                                        global.logger.write('debug', badgeCount + ' is badge count obtained from db', request)
                                        global.logger.write('debug', pushStringObj + objectCollection.util.replaceOne(badgeCount) + assetMap.asset_push_arn, request)
                                        objectCollection.sns.publish(pushStringObj, objectCollection.util.replaceOne(badgeCount), assetMap.asset_push_arn);
                                    }.bind(this));
                                }
                            });
                            next();
                        }).then(function () {
                            callback(false, true);
                        });
                    } else {
                        //console.log('push string is retrived as an empty object');
                        global.logger.write('debug','push string is retrived as an empty object', request)
                        callback(false, true);
                    }
                }.bind(this));
            }
        }

        var pushReceivers = new Array();
        objectCollection.activityCommonService.getAllParticipants(request, function (err, participantsList) {
            if (err === false) {
                var senderName = '';
                if (pushAssetId > 0) {
                    //console.log('inside add participant case');
                    objectCollection.forEachAsync(participantsList, function (next, rowData) {
                        if (Number(request.asset_id) === Number(rowData['asset_id']))   // sender details in this condition
                            senderName = rowData['operating_asset_first_name'] + ' ' + rowData['operating_asset_last_name'];
                        else if (Number(pushAssetId) === Number(rowData['asset_id'])) {
                            pushReceivers.push({assetId: rowData['asset_id'], organizationId: rowData['organization_id']});
                        }
                        next();
                    }).then(function () {
                        proceedSendPush(pushReceivers, senderName);
                    });
                } else {
                    objectCollection.forEachAsync(participantsList, function (next, rowData) {
                        if (Number(request.asset_id) !== Number(rowData['asset_id']))
                            //pushReceivers[rowData['asset_id']] = {assetId: rowData['asset_id'], organizationId: rowData['organization_id']};
                            pushReceivers.push({assetId: rowData['asset_id'], organizationId: rowData['organization_id']});
                        else
                            senderName = rowData['operating_asset_first_name'] + ' ' + rowData['operating_asset_last_name'];
                        next();
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
