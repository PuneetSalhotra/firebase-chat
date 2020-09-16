// server/utils/requestParamsValidator.js

const Joi = require('@hapi/joi');
const typeis = require('type-is');

const requestValidator = {};

requestValidator.requestParamsValidator = async function (req,res,next) {    
    
    if(exclusionList.includes(req.url)) {
        return next();
    }
    
    let validationSchema;
    if (req.headers.hasOwnProperty('accesstoken')) {
        validationSchema = Joi.object({
            // organization_id: Joi.number(),
            // account_id: Joi.number(),
            // workforce_id: Joi.number(),
    
            asset_id: Joi.number(),
            target_asset_id: Joi.number(),
            auth_asset_id: Joi.number(),
            //asset_token_auth: Joi.string()
            //    .uuid({
            //        version: ['uuidv1']
            //    }),
            // .required(),
    
    
            // Activity
            workflow_activity_id: Joi.number(),
            activity_id: Joi.number(),
            // activity_status_id: Joi.number(),
            // activity_type_category_id: Joi.number(),
            activity_type_id: Joi.number(),
            workflow_activity_type_id: Joi.number(),
    
            activity_datetime_start: Joi.date().iso(),
            activity_datetime_end: Joi.date().iso(),
    
            // Timeline
            activity_stream_type_id: Joi.number(),
    
            // Form
            form_id: Joi.number(),
            activity_form_id: Joi.number(),
            form_transaction_id: Joi.number(),
    
            // Pagination
            start_from: Joi.number(),
            limit_value: Joi.number(),
            page_start: Joi.number(),
            page_limit: Joi.number(),
    
            // Device specific and track GPS details
            device_os_id: Joi.number(), // .required(),
            track_gps_datetime: Joi.date().iso().allow(0,'0'),
            datetime_log: Joi.date().iso(),
            log_datetime: Joi.date().iso(),
    
        })
            // .or("asset_id", "auth_asset_id")
            .unknown(true);
    } else {
        validationSchema = Joi.object({
            // organization_id: Joi.number(),
            // account_id: Joi.number(),
            // workforce_id: Joi.number(),
    
            asset_id: Joi.number(),
            target_asset_id: Joi.number(),
            auth_asset_id: Joi.number(),
            asset_token_auth: Joi.string()
                .uuid({
                    version: ['uuidv1']
                }),
            // .required(),
    
    
            // Activity
            workflow_activity_id: Joi.number(),
            activity_id: Joi.number(),
            // activity_status_id: Joi.number(),
            // activity_type_category_id: Joi.number(),
            activity_type_id: Joi.number(),
            workflow_activity_type_id: Joi.number(),
    
            activity_datetime_start: Joi.date().iso(),
            activity_datetime_end: Joi.date().iso(),
    
            // Timeline
            activity_stream_type_id: Joi.number(),
    
            // Form
            form_id: Joi.number(),
            activity_form_id: Joi.number(),
            form_transaction_id: Joi.number(),
    
            // Pagination
            start_from: Joi.number(),
            limit_value: Joi.number(),
            page_start: Joi.number(),
            page_limit: Joi.number(),
    
            // Device specific and track GPS details
            device_os_id: Joi.number(), // .required(),
            track_gps_datetime: Joi.date().iso().allow(0,'0'),
            datetime_log: Joi.date().iso(),
            log_datetime: Joi.date().iso(),
    
        })
            // .or("asset_id", "auth_asset_id")
            .unknown(true);
    }
    

    //console.log('validationSchema - ', validationSchema._ids);

    try {
        const value = await validationSchema.validateAsync(req.body,{convert: true});
    } catch(error) {
        if(error) {
            // return error.details[0].message;
            return res.status(400).json({
                status: 400,
                error: error.details[0].message
            });
        }
    }
    return next();
};

requestValidator.requestMethodValidator = (req,res,next) => {
    const healthcheckURL = `/${global.config.version}/healthcheck`;
    if(
        req.url !== healthcheckURL &&
        req.method !== 'POST'
    ) {
        return res.status(405).json({error: "Oops! That's not allowed"});
    }
    next();
};

requestValidator.requestContentTypeValidator = async function (req,res,next) {
    const healthcheckURL = `/${global.config.version}/healthcheck`;
    if(
        req.url !== healthcheckURL &&
        !typeis(req, ['application/x-www-form-urlencoded', 'multipart/form-data', 'application/json','text/xml']) // 
    ) {
        return res.status(415).json({error: "Oops! Content Type not supported"});
    }
    next();
};

requestValidator.setResponseContentType = (req,res,next) => {
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.cookie('grene','1',{httpOnly: true,path: '/grene',secure: true});
    next();
};

module.exports = requestValidator;

const exclusionList = [
    `/${global.config.version}/healthcheck`,
    `/${global.config.version}/asset/passcode/alter`,
    `/${global.config.version}/asset/passcode/alter/v1`,
    `/${global.config.version}/asset/passcode/check`,
    `/${global.config.version}/asset/link/set`,
    `/${global.config.version}/asset/phonenumber/access/organization/list`,
    `/${global.config.version}/pam/asset/cover/alter/clockin`,
    `/${global.config.version}/asset/status/collection`,
    `/${global.config.version}/pam/asset/passcode/check`,
    `/${global.config.version}/pam/asset/passcode/alter/v1`,
    `/${global.config.version}/asset/signup`,
    `/${global.config.version}/email/passcode/generate`,
    `/${global.config.version}/email/passcode/verify`,
    `/${global.config.version}/send/email`,
    `/${global.config.version}/send/email/v3`,
    `/${global.config.version}/send/email/v4`,
    `/${global.config.version}/wf/send/email`,
    `/${global.config.version}/wf/send/sms`,
    `/${global.config.version}/stats/signup/count`,
    `/${global.config.version}/stats/signup/list`,
    `/${global.config.version}/stats/timeline/list`,
    `/${global.config.version}/vodafone/manual_trigger/excel_upload/child_workflows_create`,
    `/${global.config.version}/phone_number/verify/invite`
];

// Documentation: https://github.com/hapijs/joi/blob/v14.3.1/API.md#datetimestamptype
