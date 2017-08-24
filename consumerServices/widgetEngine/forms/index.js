const AttendanceForm = require('./attendanceForm');
const CONST = require('../../constants');

exports.get = function (id, args) {
    let formInstance;
    switch(id) {
    case CONST.FORM_IDS.ATTENDANCE_FORM:
        formInstance = new AttendanceForm(args);
        break;
    default:
        break;
    }
    return formInstance;
}