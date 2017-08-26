const FormBase = require('./base');
const CONST = require('../../constants');

class AttendanceForm extends FormBase {
    constructor(args) {
        super(args);
        this.id = CONST.FORM_IDS.ATTENDANCE_FORM;
    }

}

module.exports = AttendanceForm;