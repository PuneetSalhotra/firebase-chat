const winston = require('winston');
require('winston-daily-rotate-file');

const moment = require('moment');
const ip = require("ip");
let ipAddress = ip.address();
ipAddress = ipAddress.replace(/\./g, '_');

let fileName = `logs/%DATE%`;
switch (global.mode) {
    case 'staging':
        fileName = `${global.config.efsPath}staging_api/logs/${ipAddress}/%DATE%`;
        break;

    case 'preprod':
        fileName = `${global.config.efsPath}preprod_api/logs//${ipAddress}%DATE%`;
        break;

    case 'prod':
        fileName = `${global.config.efsPath}api/logs/${ipAddress}/%DATE%`;
        break;

    default:
        fileName = `logs/${ipAddress}/%DATE%`;
}

// [REFERENCE] Console Color Codes
const Reset = "\x1b[0m",
    Bright = "\x1b[1m",
    Dim = "\x1b[2m",
    Underscore = "\x1b[4m",
    Blink = "\x1b[5m",
    Reverse = "\x1b[7m",
    Hidden = "\x1b[8m",
    // Foreground
    FgBlack = "\x1b[30m",
    FgRed = "\x1b[31m",
    FgGreen = "\x1b[32m",
    FgYellow = "\x1b[33m",
    FgBlue = "\x1b[34m",
    FgMagenta = "\x1b[35m",
    FgCyan = "\x1b[36m",
    FgWhite = "\x1b[37m",
    // Background
    BgBlack = "\x1b[40m",
    BgRed = "\x1b[41m",
    BgGreen = "\x1b[42m",
    BgYellow = "\x1b[43m",
    BgBlue = "\x1b[44m",
    BgMagenta = "\x1b[45m",
    BgCyan = "\x1b[46m",
    BgWhite = "\x1b[47m";

// FILE Logger
const appendEssentialsForFileLog = winston.format(
    (info, opts) => {

        // Check if the request body exists
        if (info.request_body) {

            // Append organization_id, account_id, workforce_id
            if (info.request_body.organization_id) { info.organization_id = info.request_body.organization_id };
            if (info.request_body.account_id) { info.account_id = info.request_body.account_id };
            if (info.request_body.workforce_id) { info.workforce_id = info.request_body.workforce_id };

            // Append Activity ID details
            if (info.request_body.activity_id) { info.activity_id = info.request_body.activity_id };
            if (info.request_body.workflow_activity_id) { info.workflow_activity_id = info.request_body.workflow_activity_id };

            // Append Form Details
            if (info.request_body.form_id) { info.form_id = info.request_body.form_id };
            if (info.request_body.form_transaction_id) { info.form_transaction_id = info.request_body.form_transaction_id };
        }

        return info;
    }
);

const logger = winston.createLogger({
    transports: [
        // new winston.transports.File({
        //     filename: fileName,
        //     handleExceptions: true,
        //     maxsize: 10485760, // 5MB => 5242880 | 10MB => 10485760
        //     maxFiles: 5
        // }),
        new winston.transports.DailyRotateFile({
            datePattern: 'YYYY-MM-DD',
            filename: fileName,
            handleExceptions: true,
            maxsize: 10485760, // 5MB => 5242880 | 10MB => 10485760
            // maxFiles: 5,
            extension: '.txt'
        })
    ],
    level: 'debug',
    exitOnError: false,
    format: winston.format.combine(
        winston.format.splat(),
        winston.format.timestamp(),
        appendEssentialsForFileLog(),
        winston.format.json()
    ),
});


// CONSOLE Logger

const customFormatForConsole = winston.format.printf(({ level, type, message, timestamp, error }) => {

    return `${moment.utc(timestamp).format('YYYY-MM-DD HH:mm:ss')} ${BgBlack}${FgWhite}${type || ''}${Reset}:${level} | ${message} ${error ? "\n" : ""} ${error ? JSON.stringify({ ...error }, null, 2) : ""}`;
});


logger.add(
    new winston.transports.Console({
        level: 'silly',
        handleExceptions: true,
        format: winston.format.combine(
            winston.format.splat(),
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.prettyPrint(),
            customFormatForConsole,
            // winston.format.simple()
        )
    })
);

module.exports = logger;