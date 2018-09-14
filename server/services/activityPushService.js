/* 
 * author: Sri Sai Venkatesh
 */
const pubnubWrapper = new(require('../utils/pubnubWrapper'))(); //BETA
//const smsEngine = require('../utils/smsEngine');

function ActivityPushService(objectCollection) {
    var getPushString = function (request, objectCollection, senderName, callback) {
        var pushString = {};
        var extraData = {};
        var msg = {}; //Pubnub Push String
        var smsString = '';
        //msg.type = 'activity_unread';
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
                    case 29: //External Contact Card - Supplier
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/timeline/entry/add':
                                break;
                            case '/' + global.config.version + '/activity/status/alter':
                                break;
                            case '/' + global.config.version + '/activity/participant/access/set':
                                var activityInlineJson = JSON.parse(activityData[0]['activity_inline_data']);
                                var contactName = activityInlineJson.contact_first_name + ' ' + activityInlineJson.contact_last_name;
                                pushString.title = senderName;
                                pushString.description = contactName + ' ' + 'has beed shared as a Contact';
                                break;
                        };
                        break;
                    case 8: // Mail
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/timeline/entry/add':
                                break;
                            case '/' + global.config.version + '/activity/status/alter':
                                break;
                            case '/' + global.config.version + '/activity/participant/access/set':
                                msg.activity_type_category_id = 8;
                                msg.type = 'activity_unread';
                                pushString.title = senderName;
                                //pushString.description = 'Mail: ' + activityTitle;
                                pushString.description = 'Memo: ' + activityTitle;
                                smsString = ' ' + senderName + ' has sent a memo to your inbox. You can respond by logging into the WorldDesk app. Download Link: https://worlddesk.desker.co/';
                                break;
                            case '/' + global.config.version + '/activity/owner/alter':
                                pushString.title = senderName;
                                pushString.description = 'Folder: ' + activityTitle + ' owner is changed';
                                if (Number(request.activity_sub_type_id) === 1) {
                                    //smsString = ' ' + senderName + ' has assigned a task named ' + activityTitle + ' to you. You can respond by logging into the WorldDesk app. Download Link: https://worlddesk.desker.co/';
                                    smsString = ' ' + senderName + ' has sent a memo to your inbox. You can respond by logging into the WorldDesk app. Download Link: https://worlddesk.desker.co/';
                                }
                                break;
                                //Exclusive Pub Nub Pushes
                            case '/' + global.config.version + '/activity/unread/count/reset':
                                msg.activity_type_category_id = 8;
                                msg.type = 'activity_read';
                                break;
                                //////////////////////////////
                        };
                        break;
                    case 9: // Form
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/timeline/entry/add':
                                break;
                            case '/' + global.config.version + '/activity/status/alter':
                                break;
                            case '/' + global.config.version + '/activity/participant/access/set':
                                msg.activity_type_category_id = 9;
                                msg.type = 'activity_unread';
                                pushString.title = senderName;
                                pushString.description = 'Form has been shared for approval';
                                break;
                        };
                        break;
                    case 10: // Folders                        
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/add':
                                msg.activity_type_category_id = 10;
                                msg.type = 'activity_unread';

                                pushString.title = senderName;
                                pushString.description = 'made you the owner of: ' + activityTitle;
                                break;
                            case '/' + global.config.version + '/activity/timeline/entry/add':
                                msg.activity_type_category_id = 10;
                                msg.type = 'activity_unread';

                                pushString.title = senderName;
                                pushString.description = 'Has added an update to - ' + activityTitle;
                                if (Number(request.activity_sub_type_id) === 1)
                                    smsString = ' ' + senderName + ' has mentioned you in a task named ' + activityTitle + '. You can respond by logging into the WorldDesk app. Download Link: https://worlddesk.desker.co/';
                                else
                                    smsString = ' ' + senderName + ' has mentioned you in a task named ' + activityTitle + '. You can respond by logging into the WorldDesk app. Download Link: https://worlddesk.desker.co/';
                                break;
                            case '/' + global.config.version + '/activity/status/alter':
                                break;
                            case '/' + global.config.version + '/activity/owner/alter':
                                msg.activity_type_category_id = 10;
                                msg.type = 'activity_unread';

                                pushString.title = senderName;
                                (Number(request.owner_asset_id) === 0) ? //means unassigning
                                pushString.description = 'Task: ' + activityTitle + ' is unassigned':
                                    pushString.description = 'Task: ' + activityTitle + ' is assigned';

                                //pushString.description = 'Folder: ' + activityTitle + ' owner is changed';
                                if (Number(request.activity_sub_type_id) === 1) {
                                    smsString = ' ' + senderName + ' has assigned a task named ' + activityTitle + ' to you. You can respond by logging into the WorldDesk app. Download Link: https://worlddesk.desker.co/';
                                }
                                break;
                            case '/' + global.config.version + '/activity/participant/access/set':
                                msg.activity_type_category_id = 10;
                                msg.type = 'activity_unread';

                                pushString.title = senderName;
                                pushString.description = 'Folder: ' + activityTitle + ' has been shared to collaborate';
                                if (Number(request.activity_sub_type_id) === 1) {
                                    smsString = ' ' + senderName + ' has assigned a task named ' + activityTitle + ' to you. You can respond by logging into the WorldDesk app. Download Link: https://worlddesk.desker.co/';
                                }
                                break;
                                //Exclusive Pub Nub Pushes
                            case '/' + global.config.version + '/activity/unread/count/reset':
                                msg.activity_type_category_id = 10;
                                msg.type = 'activity_read';
                                break;
                            case '/' + global.config.version + '/activity/cover/alter':
                                msg.activity_type_category_id = 10;
                                msg.type = 'activity_duedate';

                                if (Number(request.activity_sub_type_id) === 1) {
                                    smsString = ' ' + senderName + ' has assigned a task named ' + activityTitle + ' to you. You can respond by logging into the WorldDesk app. Download Link: https://worlddesk.desker.co/';
                                }
                                break;
                                //////////////////////////

                        };
                        break;
                    case 11: // Project
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/timeline/entry/add':
                                smsString = ' ' + senderName + ' has mentioned you in a project named ' + activityTitle + '. You can respond by logging into the WorldDesk app. Download Link: https://worlddesk.desker.co/';
                                break;
                            case '/' + global.config.version + '/activity/status/alter':
                                break;
                            case '/' + global.config.version + '/activity/participant/access/set':
                                msg.activity_type_category_id = 11;
                                msg.type = 'activity_unread';
                                pushString.title = senderName;
                                pushString.description = 'Project: ' + activityTitle + ' has been shared to collaborate';
                                break;
                                //Exclusive Pub Nub Pushes
                            case '/' + global.config.version + '/activity/cover/alter':
                                msg.activity_type_category_id = 11;
                                msg.type = 'activity_duedate';
                                break;
                                ////////////////////////////
                        };
                        break;
                    case 14: // Voice Call
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/timeline/entry/add':
                                break;
                            case '/' + global.config.version + '/activity/status/alter':
                                break;
                            case '/' + global.config.version + '/activity/participant/access/set':
                                pushString.title = "Audio call";
                                pushString.description = 'Call from ' + activityInlineJson.owner_details.operating_asset_first_name;
                                extraData.type = 1;
                                extraData.call_data = {
                                    meeting_id: activityInlineJson.meeting_id,
                                    caller_asset_id: activityInlineJson.owner_details.asset_id,
                                    caller_name: senderName,
                                    activity_id: request.activity_id
                                };
                                pushString.extra_data = extraData;
                                break;
                        };
                        break;
                    case 15: // Video Conference
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/cover/alter':
                                pushString.title = senderName;
                                pushString.description = 'Meeting details has been updated for ' + activityTitle;
                                break;
                            case '/' + global.config.version + '/activity/status/alter':
                                break;
                            case '/' + global.config.version + '/activity/participant/access/set':
                                //console.log('activityInlineJson : ', activityInlineJson)
                                pushString.title = "Video call";
                                //pushString.description = 'Meeting: ' + activityTitle + ' has been scheduled at ' + (activityData[0]['activity_datetime_start_expected']);
                                pushString.description = 'Video Call from ' + activityInlineJson.owner_details.operating_asset_first_name;
                                extraData.type = 2;
                                extraData.call_data = {
                                    meeting_id: activityInlineJson.meeting_id,
                                    caller_asset_id: activityInlineJson.owner_details.asset_id,
                                    caller_name: senderName,
                                    activity_id: request.activity_id
                                };
                                pushString.extra_data = extraData;
                                break;
                        };
                        break;
                    case 28: // Remainder
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/timeline/entry/add':
                                break;
                            case '/' + global.config.version + '/activity/status/alter':
                                break;
                            case '/' + global.config.version + '/activity/participant/access/set':
                                msg.activity_type_category_id = 28;
                                msg.type = 'activity_unread';
                                pushString.title = senderName;
                                //pushString.description = activityData[0]['activity_description'].substring(0, 100);
                                pushString.description = 'sent a sticky note';
                                smsString = ' ' + senderName + ' has posted a sticky note on your desk. You can respond by logging into the WorldDesk app. Download Link: https://worlddesk.desker.co';
                                break;
                        };
                        break;
                    case 31: //Calendar Event
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/timeline/entry/add':
                                break;
                            case '/' + global.config.version + '/activity/status/alter':
                                if (Number(request.activity_status_type_id) === 79) {
                                    pushString.title = senderName;
                                    pushString.description =  'has joined the meeting - ' + activityTitle + '.';
                                }
                                break;
                            case '/' + global.config.version + '/activity/participant/access/set':
                                pushString.title = senderName;
                                pushString.description = 'has added you to the meeting - ' + activityTitle + '.';
                                break;
                        };
                        break;
                    case 32: //Customer Request
                        break;
                    case 33: //Visitor Request
                        break;
                    case 34: //Time Card
                        break;
                };
                callback(false, pushString, msg, smsString);
            } else {
                callback(true, {}, msg, smsString);
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

    this.pamSendPush = function (request, data, objectCollection, callback) {
        var pushStringObj = {};
        pushStringObj.order_id = request.activity_id;
        pushStringObj.order_name = request.activity_title;
        pushStringObj.status_type_id = 0;
        pushStringObj.station_category_id = request.activity_channel_category_id;

        data.forEach(function (arn, index) {
            //console.log(arn);
            global.logger.write('debug', arn, {}, request);
            objectCollection.sns.pamPublish(pushStringObj, 1, arn);
        });
    };

    this.pubNubPush = function (request, message, callback) {
        pubnubWrapper.push(request.asset_id, message);
        pubnubWrapper.push(request.organization_id, message);
        callback(false, true);
    };

    this.sendPush = function (request, objectCollection, pushAssetId, callback) {
        var proceedSendPush = function (pushReceivers, senderName) {
            //console.log('pushReceivers.length : ', pushReceivers.length);
            global.logger.write('debug', 'pushReceivers.length : ' + pushReceivers.length, {}, request);
            if (pushReceivers.length > 0) {
                getPushString(request, objectCollection, senderName, function (err, pushStringObj, pubnubMsg, smsString) {
                    //console.log('PubMSG : ', pubnubMsg);
                    //console.log('pushStringObj : ', pushStringObj);
                    global.logger.write('debug', 'PubMSG : ' + pubnubMsg, {}, request);
                    global.logger.write('debug', 'pushStringObj : ' + pushStringObj, {}, request);
                    if (Object.keys(pushStringObj).length > 0) {
                        objectCollection.forEachAsync(pushReceivers, function (next, rowData) {
                            objectCollection.cacheWrapper.getAssetMap(rowData.assetId, function (err, assetMap) {
                                //console.log(rowData.assetId, ' is asset for which we are about to send push');
                                //console.log('Asset Map : ', assetMap);
                                global.logger.write('debug', rowData.assetId + ' is asset for which we are about to send push', {}, request);
                                if (Object.keys(assetMap).length > 0) {
                                    getAssetBadgeCount(request, objectCollection, assetMap.asset_id, assetMap.organization_id, function (err, badgeCount) {
                                        //console.log(badgeCount, ' is badge count obtained from db');
                                        //console.log(assetMap);
                                        //console.log(pushStringObj, objectCollection.util.replaceOne(badgeCount), assetMap.asset_push_arn);
                                        global.logger.write('debug', badgeCount + ' is badge count obtained from db', {}, request);
                                        global.logger.write('debug', assetMap, {}, request);
                                        global.logger.write('debug', pushStringObj + objectCollection.util.replaceOne(badgeCount) + assetMap.asset_push_arn, {}, request);
                                        switch (rowData.pushType) {
                                            case 'pub':
                                                //console.log('pubnubMsg :', pubnubMsg);
                                                global.logger.write('debug', 'pubnubMsg :' + pubnubMsg, {}, request);
                                                if (pubnubMsg.activity_type_category_id != 0) {
                                                    pubnubMsg.organization_id = rowData.organizationId;
                                                    pubnubMsg.desk_asset_id = rowData.assetId;
                                                    //console.log('PubNub Message : ', pubnubMsg);
                                                    global.logger.write('debug', 'pubnubMsg :' + pubnubMsg, {}, request);
                                                    pubnubWrapper.push(rowData.organizationId, pubnubMsg);
                                                    pubnubWrapper.push(rowData.assetId, pubnubMsg);
                                                }
                                                //break;
                                            case 'sns':
                                                objectCollection.sns.publish(pushStringObj, objectCollection.util.replaceOne(badgeCount), assetMap.asset_push_arn);
                                                if (pubnubMsg.activity_type_category_id != 0) {
                                                    pubnubMsg.organization_id = rowData.organizationId;
                                                    pubnubMsg.desk_asset_id = rowData.assetId;
                                                    //console.log('PubNub Message : ', pubnubMsg);
                                                    global.logger.write('debug', 'pubnubMsg :' + pubnubMsg, {}, request);
                                                    pubnubWrapper.push(rowData.organizationId, pubnubMsg);
                                                    pubnubWrapper.push(rowData.assetId, pubnubMsg);
                                                }
                                                break;
                                        }
                                    }.bind(this));
                                } else if (rowData.pushType == 'pub') {
                                    if (pubnubMsg.activity_type_category_id != 0) {
                                        pubnubMsg.organization_id = rowData.organizationId;
                                        pubnubMsg.desk_asset_id = rowData.assetId
                                        //console.log('PubNub Message : ', pubnubMsg);
                                        global.logger.write('debug', 'PubNub Message :' + pubnubMsg, {}, request);
                                        pubnubWrapper.push(rowData.organizationId, pubnubMsg);
                                        pubnubWrapper.push(rowData.assetId, pubnubMsg);
                                    }
                                }
                            });
                            next();
                        }).then(function () {
                            callback(false, true);
                        });
                    } else if (Object.keys(pubnubMsg).length > 0) {
                        //console.log('Sending PubNub push Alone');
                        global.logger.write('debug', 'Sending PubNub push Alone', {}, request);
                        objectCollection.forEachAsync(pushReceivers, function (next, rowData) {
                            objectCollection.cacheWrapper.getAssetMap(rowData.assetId, function (err, assetMap) {
                                //console.log(rowData.assetId, ' is asset for which we are about to send push');
                                //console.log('Asset Map : ', assetMap);
                                global.logger.write('debug', rowData.assetId + ' is asset for which we are about to send push', {}, request);
                                global.logger.write('debug', assetMap, {}, request);
                                if (Object.keys(assetMap).length > 0) {
                                    //console.log('rowData : ', rowData);
                                    global.logger.write('debug', rowData, {}, request);
                                    switch (rowData.pushType) {
                                        case 'pub':
                                            //console.log('pubnubMsg :', pubnubMsg);
                                            global.logger.write('debug', 'pubnubMsg : ' + pubnubMsg, {}, request);
                                            if (pubnubMsg.activity_type_category_id != 0) {
                                                pubnubMsg.organization_id = rowData.organizationId;
                                                pubnubMsg.desk_asset_id = rowData.assetId;
                                                //console.log('PubNub Message : ', pubnubMsg);
                                                global.logger.write('debug', 'PubNub Message : ' + pubnubMsg, {}, request);
                                                pubnubWrapper.push(rowData.organizationId, pubnubMsg);
                                                pubnubWrapper.push(rowData.assetId, pubnubMsg);
                                            }
                                            break;
                                    }
                                }
                            });
                            next();
                        }).then(function () {
                            callback(false, true);
                        });
                    } else {
                        //console.log('push string is retrived as an empty object');
                        global.logger.write('debug', 'push string is retrived as an empty object', {}, request)
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

                objectCollection.activityCommonService.getAssetActiveAccount(participantsList)
                    .then((newParticipantsList) => {
                        if (pushAssetId > 0) {
                            objectCollection.forEachAsync(newParticipantsList, function (next, rowData) {
                                if (Number(request.asset_id) === Number(rowData['asset_id'])) { // sender details in this condition
                                    senderName = rowData['operating_asset_first_name'] + ' ' + rowData['operating_asset_last_name'];
                                    next();
                                } else if (Number(pushAssetId) === Number(rowData['asset_id'])) {
                                    reqobj = {
                                        organization_id: rowData['organization_id'],
                                        asset_id: rowData['asset_id']
                                    };
                                    objectCollection.activityCommonService.getAssetDetails(reqobj, function (err, data, resp) {
                                        //console.log('SESSION DATA : ', data.asset_session_status_id);
                                        global.logger.write('debug', 'SESSION DATA : ' + data.asset_session_status_id, {}, request);
                                        if (err === false) {
                                            switch (data.asset_session_status_id) {
                                                case 8:
                                                    pushReceivers.push({
                                                        assetId: rowData['asset_id'],
                                                        organizationId: rowData['organization_id'],
                                                        pushType: 'sns'
                                                    });
                                                    //pushReceivers.push({assetId: rowData['asset_id'], organizationId: rowData['organization_id'], pushType: 'pub'});
                                                    break;
                                                case 9:
                                                    pushReceivers.push({
                                                        assetId: rowData['asset_id'],
                                                        organizationId: rowData['organization_id'],
                                                        pushType: 'pub'
                                                    });
                                                    break;
                                                default:
                                                    pushReceivers.push({
                                                        assetId: rowData['asset_id'],
                                                        organizationId: rowData['organization_id'],
                                                        pushType: 'sns'
                                                    });
                                                    break;
                                            }
                                        }
                                        next();
                                    })
                                } else
                                    next();
                            }).then(function () {
                                proceedSendPush(pushReceivers, senderName);
                            });
                        } else {
                            objectCollection.forEachAsync(newParticipantsList, function (next, rowData) {
                                if (Number(request.asset_id) !== Number(rowData['asset_id'])) {
                                    reqobj = {
                                        organization_id: rowData['organization_id'],
                                        asset_id: rowData['asset_id']
                                    };
                                    objectCollection.activityCommonService.getAssetDetails(reqobj, function (err, data, resp) {
                                        //console.log('SESSION DATA : ', data.asset_session_status_id);
                                        global.logger.write('debug', 'SESSION DATA : ' + data.asset_session_status_id, {}, request);
                                        if (err === false) {
                                            switch (data.asset_session_status_id) {
                                                case 8:
                                                    pushReceivers.push({
                                                        assetId: rowData['asset_id'],
                                                        organizationId: rowData['organization_id'],
                                                        pushType: 'sns'
                                                    });
                                                    //pushReceivers.push({assetId: rowData['asset_id'], organizationId: rowData['organization_id'], pushType: 'pub'});
                                                    break;
                                                case 9:
                                                    pushReceivers.push({
                                                        assetId: rowData['asset_id'],
                                                        organizationId: rowData['organization_id'],
                                                        pushType: 'pub'
                                                    });
                                                    break;
                                                default:
                                                    pushReceivers.push({
                                                        assetId: rowData['asset_id'],
                                                        organizationId: rowData['organization_id'],
                                                        pushType: 'sns'
                                                    });
                                                    break;
                                            }
                                        }
                                        next();
                                    });
                                } else {
                                    senderName = rowData['operating_asset_first_name'] + ' ' + rowData['operating_asset_last_name'];
                                    next();
                                }
                            }).then(function () {
                                proceedSendPush(pushReceivers, senderName);
                            });
                        }
                    }).catch((err) => {
                        //console.log("Unable to retrieve the Receiver's asset phone number : ", err);
                        global.logger.write('debug', "Unable to retrieve the Receiver's asset phone number : " + err, {}, request);
                    });
            }
        });
    };

    this.sendSMSNotification = function (request, objectCollection, pushAssetId, callback) {
        var reqobj = {};
        //getting asset deatails of the reciever
        reqobj = {
            organization_id: request.organization_id,
            asset_id: pushAssetId
        };
        objectCollection.activityCommonService.getAssetDetails(reqobj, function (err, RecieverData, resp) {
            var diffDatetime = objectCollection.util.differenceDatetimes(request.datetime_log, objectCollection.util.replaceDefaultDatetime(RecieverData.asset_status_datetime));
            if (diffDatetime.years > 0 || diffDatetime.months > 0 || diffDatetime.days >= 2) {
                // send an sms notification
                // getting asset details of log asset id
                reqobj = {
                    organization_id: request.organization_id,
                    asset_id: request.asset_id
                };
                objectCollection.activityCommonService.getAssetDetails(reqobj, function (err, senderData, resp) {

                    if (senderData.asset_count_signup > 0) {
                        var senderName = senderData['operating_asset_first_name'] + ' ' + senderData['operating_asset_last_name'];
                        getPushString(request, objectCollection, senderName, function (err, pushStringObj, pubnubMsg, smsString) {

                            //console.log('SMS String : ', smsString);
                            global.logger.write('debug', 'SMS String : '+ smsString, {}, request);

                             objectCollection.util.sendSmsSinfini(smsString, RecieverData.operating_asset_phone_country_code, RecieverData.operating_asset_phone_number, function () {

                             });

                            // GitHub PR (Pull Request) #19: Test out the SMS Engine on SMS Notifications
                            // If it works remove the above commented-out 'sendSmsSinfini' method call.
                            /*let smsOptions = {
                                type: 'NOTFCTN ', // Other types: 'OTP' | 'COLLBRTN' | 'INVTATN',
                                countryCode: RecieverData.operating_asset_phone_country_code,
                                phoneNumber: RecieverData.operating_asset_phone_number,
                                msgString: smsString,
                                smsServiceProvider: 'sinfini',
                                failOver: false
                            };
                            smsEngine.sendDomesticSms(smsOptions);*/

                        }.bind(this));
                    }

                });
            } else {
                //console.log('active in last 48 hrs');
                global.logger.write('debug', 'active in last 48 hrs', {}, request);
            }

        });
    };
};

module.exports = ActivityPushService;