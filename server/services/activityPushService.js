/* 
* author: Sri Sai Venkatesh
*/
const pubnubWrapper = new (require('../utils/pubnubWrapper'))(); //BETA
//const smsEngine = require('../utils/smsEngine');
const moment = require('moment');

function ActivityPushService(objectCollection) {
    const cacheWrapper = objectCollection.cacheWrapper;

    var getPushString = function (request, objectCollection, senderName, callback) {
        var pushString = {};
        var extraData = {};
        var msg = {}; //Pubnub Push String
        var smsString = '';
        //msg.type = 'activity_unread';
        msg.activity_type_category_id = 0;
        msg.activity_id = request.activity_id;

        var activityTypeCategoryId = Number(request.activity_type_category_id);
        objectCollection.activityCommonService.getActivityDetails(request, 0, async function (err, activityData) {
            if (err === false) {
                var activityTitle = activityData[0]['activity_title'];
                var activityInlineJson = JSON.parse(activityData[0]['activity_inline_data']);

                var activityId = activityData[0]['activity_id'];
                pushString.activity_id = activityId;
                // pushString.activity_inline_data = activityInlineJson;

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
                        }
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
                        }
                        break;
                    case 9: // Form
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/add':
                            case '/' + global.config.version + '/activity/add/v1':

                                pushString.title = senderName;
                                pushString.description = 'Has submitted a form: ' + activityTitle;

                                break;
                            case '/' + global.config.version + '/activity/timeline/entry/add':

                                pushString.title = senderName;
                                pushString.description = 'Has added an update to the form: ' + activityTitle;

                                const newOrderFormId = global.vodafoneConfig[request.organization_id].FORM_ID.NEW_ORDER;

                                if (Number(activityData[0].form_id) === Number(newOrderFormId)) {
                                    switch (Number(request.form_id)) {
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.FR:
                                            pushString.description = 'Has added FR to ' + activityTitle;
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.CRM:
                                            pushString.description = 'Has added CRM to ' + activityTitle;
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.HLD:
                                            pushString.description = 'Has added HLD to ' + activityTitle;
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.BC_HLD:
                                            pushString.description = 'Has added BC/HLD to ' + activityTitle;
                                            break;
                                        case global.vodafoneConfig[request.organization_id].FORM_ID.CAF:
                                            pushString.description = 'Has added CAF to ' + activityTitle;
                                            break;
                                    }

                                    const [formConfigError, formConfigData] = await objectCollection
                                        .activityCommonService
                                        .workforceFormMappingSelect(request);
                                    if (
                                        formConfigError === false &&
                                        Number(formConfigData.length) > 0 &&
                                        Number(formConfigData[0].form_flag_workflow_enabled) === 1
                                    ) {
                                        pushString.description = `added ${formConfigData[0].form_name} to ${activityTitle}`;
                                    }
                                    console.log("ActivityPushService | getPushString | description: ", pushString.description);
                                    // console.log("ActivityPushService | getPushString: ", request);
                                }

                                msg.activity_type_category_id = 9
                                msg.type = 'activity_unread'
                                msg.organization_id = request.organization_id;

                                break;
                            case '/' + global.config.version + '/activity/status/alter':

                                pushString.title = senderName;
                                pushString.description = 'Status changed for form: ' + activityTitle;

                                msg.activity_type_category_id = 9
                                msg.type = 'activity_unread'
                                msg.organization_id = request.organization_id;

                                break;
                            case '/' + global.config.version + '/activity/participant/access/set':
                                msg.activity_type_category_id = 9;
                                msg.type = 'activity_unread';
                                pushString.title = senderName;
                                pushString.description = 'Form has been shared for approval';
                                break;

                            case '/' + global.config.version + '/activity/timeline/entry/add/external':
                                msg.activity_type_category_id = 9;
                                msg.type = 'activity_unread';
                                pushString.title = senderName;
                                pushString.description = 'Form has been shared';
                                break;
                        }
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
                                    pushString.description = 'Task: ' + activityTitle + ' is unassigned' :
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

                        }
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
                        }
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
                        }
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
                        }
                        break;
                    case 16:   // Telephone module: Chat
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/timeline/entry/add':
                                // Added an update to the chat
                                if (Number(request.activity_stream_type_id) === 23003) {
                                    // Push Notification
                                    pushString.title = senderName;
                                    pushString.description = JSON.parse(request.activity_timeline_collection).message;

                                    // PubNub
                                    msg.activity_type_category_id = 16;
                                    msg.type = 'activity_unread';

                                }

                                break;

                        }
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
                        }
                        break;
                    case 31: //Calendar Event
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/timeline/entry/add':
                                break;
                            case '/' + global.config.version + '/activity/status/alter':
                                if (Number(request.activity_status_type_id) === 79) {
                                    pushString.title = senderName;
                                    pushString.description = 'has joined the meeting - ' + activityTitle + '.';
                                }
                                break;
                            case '/' + global.config.version + '/activity/participant/access/set':
                                pushString.title = senderName;
                                pushString.description = 'has added you to the meeting - ' + activityTitle + '.';
                                break;
                        }
                        break;
                    case 32: //Customer Request
                        break;
                    case 33: //Visitor Request
                        break;
                    case 34: //Time Card
                        break;
                    case 48: // Process/Workflow
                        if (
                            Number(request.asset_id) === 31993 ||
                            Number(request.asset_id) === 100
                        ) {
                            senderName = "TONY";
                        }
                        switch (request.url) {
                            case '/' + global.config.version + '/activity/timeline/entry/add':
                            case '/' + global.config.version + '/activity/timeline/entry/add/v1':
                                let attachments = [];
                                try {
                                    attachments = JSON.parse(request.activity_timeline_collection).attachments;
                                } catch (error) { }
                                // if (Number(attachments.length) > 0) {
                                // Text comment
                                if (Number(request.activity_stream_type_id) === 325) {
                                    msg.activity_type_category_id = 48;
                                    msg.type = 'activity_unread';
                                    msg.description = `Added text in ${activityTitle}.`;
                                    pushString.description = `Added text in ${activityTitle}.`;
                                    pushString.title = senderName;

                                    if (Number(attachments.length) > 0) {
                                        msg.description = `Added attachment in ${activityTitle}.`;
                                        pushString.description = `Added attachment in ${activityTitle}.`;
                                    }
                                }

                                // When a form is freshly added to a workflow
                                if (Number(request.activity_stream_type_id) === 705) {
                                    // msg.activity_type_category_id = 48;
                                    // msg.type = 'activity_unread';
                                    // msg.description = `Added text in ${activityTitle}.`;

                                    pushString.title = senderName;
                                    pushString.description = `${senderName} added a form to ${activityTitle}.`;
                                }

                                // When a form is freshly added to a workflow
                                if (Number(request.activity_stream_type_id) === 713) {
                                    // msg.activity_type_category_id = 48;
                                    // msg.type = 'activity_unread';
                                    // msg.description = `Added text in ${activityTitle}.`;

                                    pushString.title = senderName;
                                    pushString.description = `${senderName} updated a form in ${activityTitle}.`;
                                } else {
                                    // console.log("Wow!!!!! Request", request);
                                }
                                break;
                            case '/' + global.config.version + '/activity/status/alter':
                                // case '/' + global.config.version + '/activity/participant/access/set':
                                msg.activity_type_category_id = 48;
                                msg.type = 'activity_unread';
                                pushString.title = senderName;
                                pushString.description = 'has added an update - ' + activityTitle + '.';
                                break;
                            case '/' + global.config.version + '/activity/unread/count/reset':
                            case '/' + global.config.version + '/activity/unread/count/reset/v1':
                                msg.activity_type_category_id = 48;
                                msg.type = 'activity_read';

                                // 2nd July 2019 04:03 PM IST: DO NOT SEND push to Android or iOS
                                pushString = {};
                                break;
                        }
                        console.log("getPushString | request.url: ", request.url);
                        console.log("getPushString | request.activity_stream_type_id: ", request.activity_stream_type_id);
                        console.log("getPushString | pushString: ", pushString);
                        console.log("getPushString | msg: ", msg);
                        console.log("getPushString | request.asset_id: ", request.asset_id);
                        break;
                }

                // Include activity_id and its category id in the push message, if there is a
                // push notification intended for a specific servie. So, the client can redirect
                // users to the specific activity (Task, Meeting, etc.) in the app.
                if (Object.keys(pushString).length > 0 &&
                    request.hasOwnProperty('activity_id') &&
                    request.hasOwnProperty('activity_type_category_id')) {
                    // 
                    pushString.activity_id = request.activity_id;
                    pushString.activity_type_category_id = request.activity_type_category_id;
                }

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
        pushStringObj.item_order_count = request.item_order_count;

        data.forEach(function (arn, index) {
            //console.log(arn);
            global.logger.write('debug', arn, {}, {});
            objectCollection.sns.pamPublish(pushStringObj, 1, arn);
        });
    };

    async function orgRateLimitCheckAndSet(organizationID) {
        let isOrgRateLimitExceeded = false;
        try {
            const pushTimestamp = await cacheWrapper.getOrgLastPubnubPushTimestamp(organizationID);
            const timeDiff = moment.utc().diff(moment.utc(pushTimestamp));
            if (moment.duration(timeDiff).asSeconds() <= 120) {
                console.log("sendPush | timeDiff Duration: ", moment.duration(timeDiff).asSeconds())
                // It's still less than 2 minutes since the last org level push was sent.
                isOrgRateLimitExceeded = true;
            } else {
                const timestampSet = await cacheWrapper.setOrgLastPubnubPushTimestamp(organizationID, moment().utc().format('YYYY-MM-DD HH:mm:ss'));
                console.log("sendPush | timestampSet: ", timestampSet)
            }
        } catch (error) {
            console.log("ActivityPushService | sendPush | isOrgRateLimitExceeded: ", error);
        }
        return isOrgRateLimitExceeded;
    }

    this.pubNubPush = async function (request, message, callback) {
        // 
        let isOrgRateLimitExceeded = false;
        let organizationID = Number(request.organization_id);
        try {
            isOrgRateLimitExceeded = await orgRateLimitCheckAndSet(organizationID);
        } catch (error) {
            console.log("pubNubPush | orgRateLimitCheckAndSet | Error: ", error);
        }
        //
        pubnubWrapper.push(request.asset_id, message);
        pubnubWrapper.push(request.organization_id, message, isOrgRateLimitExceeded);
        callback(false, true);
    };

    this.sendPush = async function (request, objectCollection, pushAssetId, callback) {

        // 
        let isOrgRateLimitExceeded = false;
        let organizationID = Number(request.organization_id);
        try {
            isOrgRateLimitExceeded = await orgRateLimitCheckAndSet(organizationID);
        } catch (error) {
            console.log("sendPush | orgRateLimitCheckAndSet | Error: ", error);
        }
        //

        var proceedSendPush = function (pushReceivers, senderName) {
            //console.log('pushReceivers.length : ', pushReceivers.length);
            global.logger.write('debug', 'pushReceivers.length : ' + pushReceivers.length, {}, {});
            if (pushReceivers.length > 0) {
                getPushString(request, objectCollection, senderName, function (err, pushStringObj, pubnubMsg, smsString) {
                    //console.log('PubMSG : ', pubnubMsg);
                    //console.log('pushStringObj : ', pushStringObj);
                    global.logger.write('debug', 'PubMSG: ' + JSON.stringify(pubnubMsg), {}, {});
                    global.logger.write('conLog', pubnubMsg, {}, {});
                    global.logger.write('debug', 'pushStringObj : ' + JSON.stringify(pushStringObj), {}, {});
                    global.logger.write('conLog', pushStringObj, {}, {});
                    if (Object.keys(pushStringObj).length > 0) {
                        let cnt = 0;
                        objectCollection.forEachAsync(pushReceivers, function (next, rowData) {
                            objectCollection.cacheWrapper.getAssetMap(rowData.assetId, function (err, assetMap) {
                                //console.log(rowData.assetId, ' is asset for which we are about to send push');
                                //console.log('Asset Map : ', assetMap);
                                global.logger.write('debug', rowData.assetId + ' is asset for which we are about to send push', {}, {});
                                if (Object.keys(assetMap).length > 0) {
                                    getAssetBadgeCount(request, objectCollection, assetMap.asset_id, assetMap.organization_id, function (err, badgeCount) {
                                        //console.log(badgeCount, ' is badge count obtained from db');
                                        //console.log(assetMap);
                                        //console.log(pushStringObj, objectCollection.util.replaceOne(badgeCount), assetMap.asset_push_arn);
                                        global.logger.write('debug', badgeCount + ' is badge count obtained from db', {}, {});
                                        global.logger.write('debug', assetMap, {}, {});
                                        global.logger.write('debug', JSON.stringify(pushStringObj) + ' ' + objectCollection.util.replaceOne(badgeCount) + ' ' + assetMap.asset_push_arn, {}, {});
                                        switch (rowData.pushType) {
                                            // case 'pub':
                                            //     //console.log('pubnubMsg :', pubnubMsg);
                                            //     global.logger.write('debug', 'pubnubMsg :' + JSON.stringify(pubnubMsg, null, 2), {}, request);
                                            //     if (pubnubMsg.activity_type_category_id != 0) {
                                            //         pubnubMsg.organization_id = rowData.organizationId;
                                            //         pubnubMsg.desk_asset_id = rowData.assetId;
                                            //         //console.log('PubNub Message : ', pubnubMsg);
                                            //         global.logger.write('debug', 'pubnubMsg :' + JSON.stringify(pubnubMsg, null, 2), {}, request);
                                            //         pubnubWrapper.push(rowData.organizationId, pubnubMsg);
                                            //         pubnubWrapper.push(rowData.assetId, pubnubMsg);
                                            //     }
                                            //     //break;
                                            // case 'sns':
                                            //     objectCollection.sns.publish(pushStringObj, objectCollection.util.replaceOne(badgeCount), assetMap.asset_push_arn);
                                            //     if (pubnubMsg.activity_type_category_id != 0) {
                                            //         pubnubMsg.organization_id = rowData.organizationId;
                                            //         pubnubMsg.desk_asset_id = rowData.assetId;
                                            //         //console.log('PubNub Message : ', pubnubMsg);
                                            //         global.logger.write('debug', 'pubnubMsg :' + JSON.stringify(pubnubMsg, null, 2), {}, request);
                                            //         pubnubWrapper.push(rowData.organizationId, pubnubMsg);
                                            //         pubnubWrapper.push(rowData.assetId, pubnubMsg);
                                            //     }
                                            //     break;
                                            default:
                                                //SNS
                                                try {
                                                    objectCollection.sns.publish(pushStringObj, objectCollection.util.replaceOne(badgeCount), assetMap.asset_push_arn);
                                                } catch (error) {
                                                    console.log("activityPushService.js | sendPush | objectCollection.sns.publish | Error: ", error);
                                                }
                                                if (pubnubMsg.activity_type_category_id != 0) {
                                                    pubnubMsg.organization_id = rowData.organizationId;
                                                    pubnubMsg.desk_asset_id = rowData.assetId;
                                                    //console.log('PubNub Message : ', pubnubMsg);
                                                    global.logger.write('debug', 'pubnubMsg: ' + JSON.stringify(pubnubMsg), {}, {});
                                                    if (cnt === 0) { //Pushing org pubnub only once for each activity
                                                        pubnubWrapper.push(rowData.organizationId, pubnubMsg, isOrgRateLimitExceeded);
                                                    }
                                                    pubnubWrapper.push(rowData.assetId, pubnubMsg);
                                                }
                                                //PUB
                                                //console.log('pubnubMsg :', pubnubMsg);
                                                global.logger.write('debug', 'pubnubMsg: ' + JSON.stringify(pubnubMsg), {}, {});
                                                /*if (pubnubMsg.activity_type_category_id != 0) {
                                                    pubnubMsg.organization_id = rowData.organizationId;
                                                    pubnubMsg.desk_asset_id = rowData.assetId;
                                                    //console.log('PubNub Message : ', pubnubMsg);
                                                    global.logger.write('debug', 'pubnubMsg: ' + JSON.stringify(pubnubMsg), {}, {});
                                                    pubnubWrapper.push(rowData.organizationId, pubnubMsg, isOrgRateLimitExceeded);
                                                    pubnubWrapper.push(rowData.assetId, pubnubMsg);
                                                }*/
                                                break;
                                        }
                                    }.bind(this));
                                } else if (rowData.pushType == 'pub') {
                                    if (pubnubMsg.activity_type_category_id != 0) {
                                        pubnubMsg.organization_id = rowData.organizationId;
                                        pubnubMsg.desk_asset_id = rowData.assetId;
                                        //console.log('PubNub Message : ', pubnubMsg);
                                        global.logger.write('debug', 'PubNub Message: ' + JSON.stringify(pubnubMsg), {}, {});
                                        if (cnt === 0) { //Pushing org pubnub only once for each activity
                                            pubnubWrapper.push(rowData.organizationId, pubnubMsg, isOrgRateLimitExceeded);
                                        }
                                        pubnubWrapper.push(rowData.assetId, pubnubMsg);
                                    }
                                }
                                cnt++;
                            });
                            next();
                        }).then(function () {
                            callback(false, true);
                        });
                    } else if (Object.keys(pubnubMsg).length > 0) {
                        //console.log('Sending PubNub push Alone');
                        global.logger.write('conLog', 'Sending PubNub push Alone', {}, {});
                        let cnt = 0;
                        objectCollection.forEachAsync(pushReceivers, function (next, rowData) {
                            objectCollection.cacheWrapper.getAssetMap(rowData.assetId, function (err, assetMap) {
                                //console.log(rowData.assetId, ' is asset for which we are about to send push');
                                //console.log('Asset Map : ', assetMap);
                                global.logger.write('debug', rowData.assetId + ' is asset for which we are about to send push', {}, {});
                                //global.logger.write('debug', assetMap, {}, {});                                                                
                                if (Object.keys(assetMap).length > 0) {
                                    //console.log('rowData : ', rowData);
                                    global.logger.write('debug', rowData, {}, {});
                                    switch (rowData.pushType) {
                                        case 'pub':
                                            //console.log('pubnubMsg :', pubnubMsg);
                                            global.logger.write('debug', 'pubnubMsg: ' + JSON.stringify(pubnubMsg, null, 2), {}, {});
                                            if (pubnubMsg.activity_type_category_id != 0) {
                                                pubnubMsg.organization_id = rowData.organizationId;
                                                pubnubMsg.desk_asset_id = rowData.assetId;
                                                //console.log('PubNub Message : ', pubnubMsg);
                                                global.logger.write('debug', 'PubNub Message: ' + JSON.stringify(pubnubMsg), {}, {});
                                                if (cnt === 0) {
                                                    pubnubWrapper.push(rowData.organizationId, pubnubMsg, isOrgRateLimitExceeded);
                                                }
                                                pubnubWrapper.push(rowData.assetId, pubnubMsg);
                                            }
                                            break;
                                        default:
                                            //console.log('pubnubMsg :', pubnubMsg);
                                            //global.logger.write('debug', 'pubnubMsg: ' + JSON.stringify(pubnubMsg, null, 2), {}, {});
                                            if (pubnubMsg.activity_type_category_id != 0) {
                                                pubnubMsg.organization_id = rowData.organizationId;
                                                pubnubMsg.desk_asset_id = rowData.assetId;
                                                //console.log('PubNub Message : ', pubnubMsg);
                                                global.logger.write('debug', 'PubNub Message: ' + JSON.stringify(pubnubMsg, null, 2), {}, {});
                                                if (cnt === 0) {
                                                    pubnubWrapper.push(rowData.organizationId, pubnubMsg, isOrgRateLimitExceeded);
                                                }
                                                pubnubWrapper.push(rowData.assetId, pubnubMsg);
                                            }
                                            break;
                                    }
                                    cnt++;
                                }
                            });
                            next();
                        }).then(function () {
                            callback(false, true);
                        });
                    } else {
                        //console.log('push string is retrived as an empty object');
                        global.logger.write('conLog', 'push string is retrived as an empty object', {}, {});
                        callback(false, true);
                    }
                }.bind(this));
            }
        };

        var pushReceivers = new Array();
        objectCollection.activityCommonService.getAllParticipants(request, function (err, participantsList) {
            if (err === false) {
                var senderName = '';
                var reqobj = {};

                //global.logger.write('debug', 'request params in the activityPush Service', {}, request);
                //global.logger.write('debug', request, {}, request);

                objectCollection.activityCommonService.getAssetActiveAccount(participantsList)
                    .then((newParticipantsList) => {
                        if (pushAssetId > 0) {

                            global.logger.write('debug', 'pushAssetId: ' + pushAssetId, {}, {});

                            objectCollection.forEachAsync(newParticipantsList, function (next, rowData) {

                                global.logger.write('debug', 'Number(request.asset_id): ' + JSON.stringify(request.asset_id), {}, request);
                                global.logger.write('debug', 'Number(rowData[asset_id]): ' + JSON.stringify(rowData['asset_id']), {}, request);
                                global.logger.write('debug', 'Expression: ' + JSON.stringify(Number(request.asset_id) === Number(rowData['asset_id'])), {}, request);

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
                                        global.logger.write('debug', 'SESSION DATA: ' + data.asset_session_status_id, {}, request);
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

                                global.logger.write('debug', 'Number(request.asset_id): ' + JSON.stringify(request.asset_id), {}, request);
                                global.logger.write('debug', 'Number(rowData[asset_id]): ' + JSON.stringify(rowData['asset_id']), {}, request);
                                global.logger.write('debug', 'Expression: ' + JSON.stringify(Number(request.asset_id) !== Number(rowData['asset_id'])), {}, request);

                                if (Number(request.asset_id) !== Number(rowData['asset_id'])) {
                                    reqobj = {
                                        organization_id: rowData['organization_id'],
                                        asset_id: rowData['asset_id']
                                    };
                                    objectCollection.activityCommonService.getAssetDetails(reqobj, function (err, data, resp) {
                                        //console.log('SESSION DATA : ', data.asset_session_status_id);
                                        global.logger.write('debug', 'SESSION DATA: ' + data.asset_session_status_id, {}, request);
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
                            global.logger.write('debug', 'SMS String: ' + JSON.stringify(smsString), {}, request);

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
                global.logger.write('conLog', 'active in last 48 hrs', {}, request);
            }

        });
    };
};

module.exports = ActivityPushService;
