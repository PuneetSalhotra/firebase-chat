// server/utils/requestParamsValidator.js

const Joi = require('@hapi/joi');

async function requestParamsValidator(req, res, next) {

    if (exclusionList.includes(req.url)) {
        next()
    }

    const validationSchema = Joi.object({
        organization_id: Joi.number(),
        account_id: Joi.number(),
        workforce_id: Joi.number(),

        asset_id: Joi.number(),
        auth_asset_id: Joi.number(),
        asset_token_auth: Joi.string()
            .uuid({
                version: ['uuidv1']
            })
            .required(),


        // Activity
        workflow_activity_id: Joi.number(),
        activity_id: Joi.number(),
        activity_status_id: Joi.number(),
        activity_type_category_id: Joi.number(),

        // Form
        form_id: Joi.number(),
        activity_form_id: Joi.number(),

        // Device specific and track GPS details
        device_os_id: Joi.number().required(),
        track_gps_datetime: Joi.date().iso(),
        datetime_log: Joi.date().iso(),

    })
        .or("asset_id", "auth_asset_id")
        .unknown(true);

    try {
        const value = await validationSchema.validateAsync(req.body, { convert: true });
    } catch (error) {
        if (error) {
            // return error.details[0].message;
            return res.status(400).json({
                status: 400,
                error: error.details[0].message
            })
        }
    }
    next();
}

module.exports = requestParamsValidator;

const exclusionList = [
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
];

// Documentation: https://github.com/hapijs/joi/blob/v14.3.1/API.md#datetimestamptype
