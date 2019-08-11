const winston = require('winston');
const Util = require('../utils/util');
const util = new Util();

let fileName = `logs/${util.getCurrentDate()}.txt`;
if (global.mode === 'staging') {
    // /apistaging-data/staging_api/logs
    fileName = `${global.config.efsPath}staging_api/logs`;
}


let options = {
    file: {
        filename: fileName,
        handleExceptions: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    },
    console: {
        handleExceptions: true,
    },
};

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
        }

        return info;
    }
);

const logger = winston.createLogger({
    transports: [
        new winston.transports.File(options.file)
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

// const customFormatForConsole = winston.format(
//     (info, opts) => {

//         // Need not print the result of a DB stored proc's call to the console
//         if (info.db_response) { info.db_response = undefined; }

//         // Need not print the request_body as well
//         if (info.request_body) { info.request_body = undefined; }

//         return info;
//     }
// );

const customFormatForConsole = winston.format.printf(({ level, message, timestamp }) => {
    return `[${timestamp} | ${level}]: ${message}`;
});


logger.add(
    new winston.transports.Console({
        level: 'silly',
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