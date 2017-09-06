/**
 * author: SBK
 */

const CONST = require('../../constants');
const FormBase = require('./base');

exports.get = function (id, args) {
    let formInstance;
    args.id = id;
    formInstance = new FormBase(args);
    
    return formInstance;
}