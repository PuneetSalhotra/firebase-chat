/*
 * author: Sri Sai Venkatesh
 */

let db = require("../utils/dbWrapper");
let Util = require('../utils/util');
let util = new Util();

function AssetConfigService() {

    this.getAssetTypesList = function (request, callback) {
        let paramsArr = new Array(
            request.organization_id,
            request.account_id,
            request.workforce_id,
            request.datetime_differential,
            request.page_start,
            util.replaceQueryLimit(request.page_limit)
        );
        let queryString = util.getQueryString('ds_v1_workforce_asset_type_mapping_select', paramsArr);
        if (queryString != '') {
            db.executeQuery(1, queryString, request, (err, data) => {
                let newData;
                if(request.hasOwnProperty('asset_type_category_id')) {                    
                    newData = [];
                    for(let i=0; i< data.length; i++) {                                
                        if(Number(request.asset_type_category_id) === Number(data[i].asset_type_category_id)) {                 
                            newData.push(data[i]);
                        }
                    }
                } else {
                    newData = data;
                }

                if (err === false) {
                    newData.forEach(function (rowData, index) {
                        
                        rowData.log_asset_first_name = util.replaceDefaultString(rowData.log_asset_first_name);
                        rowData.log_asset_last_name = util.replaceDefaultString(rowData.log_asset_last_name);
                        rowData.log_datetime = util.replaceDefaultDatetime(rowData.log_datetime);
                        rowData.asset_type_description = util.replaceDefaultString(rowData.asset_type_description);
                        rowData.workforce_default_module_id = util.replaceDefaultNumber(rowData['workforce_default_module_id']);
                        rowData.workforce_default_module_name = util.replaceDefaultString(rowData['workforce_default_module_name']);
                        rowData.account_default_module_id = util.replaceDefaultNumber(rowData['account_default_module_id']);
                        rowData.account_default_module_name = util.replaceDefaultString(rowData['account_default_module_name']);

                    }, this);
                    callback(false, {
                        data: newData
                    }, 200);
                    return;
                } else {
                    // some thing is wrong and have to be dealt
                    callback(err, false, -9999);
                    return;
                }
            });
        }
    };

    this.updateWorkforceAssetType = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.asset_type_id,
            request.asset_type_name,
            request.asset_type_flag_enable_approval,
            request.asset_type_approval_max_levels,
            request.asset_type_approval_wait_duration,
            request.asset_type_approval_activity_type_id,
            request.asset_type_approval_activity_type_name,
            request.asset_type_approval_origin_form_id,
            request.asset_type_approval_field_id,
            request.asset_type_attendance_type_id,
            request.asset_type_attendance_type_name,
            request.asset_type_flag_enable_suspension,
            request.asset_type_suspension_activity_type_id,
            request.asset_type_suspension_activity_type_name,
            request.asset_type_suspension_wait_duration,
            request.asset_type_flag_hide_organization_details,
            request.asset_type_flag_sip_enabled,
            request.asset_type_flag_enable_send_sms || 0,
            request.asset_type_flag_sip_admin_access || 0,
            request.organization_id,
            request.flag,
            util.getCurrentUTCTime(),
            request.asset_id
        ];
        const queryString = util.getQueryString('ds_p2_workforce_asset_type_mapping_update', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    };
    

    this.updateAssetListSuspension = async (request) => {
        let responseData = [],
            error = true;
        let paramsArr = [
            request.target_asset_id,
            request.organization_id,
            request.asset_flag_suspended,
            request.asset_suspension_datetime,
            request.asset_suspension_activity_id,
            request.asset_id,
            util.getCurrentUTCTime()
        ];
        const queryString = util.getQueryString('ds_p1_asset_list_update_suspension', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(0, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    };

    this.selectAssetManager = async (request) => {
        let responseData = [],
            error = true;

        let paramsArr = [
            request.organization_id,
            request.asset_id,
            request.manager_asset_id,
            request.flag,
            request.page_start,
            request.page_limit
        ];
        const queryString = util.getQueryString('ds_p2_asset_manager_mapping_select', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                    responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
    };


    this.inputTypeMasterInsert = async (request) => {

        let responseData = [],
            error = true;
            // N p_input_type_name VARCHAR(50),
            // IN p_input_type_description VARCHAR(300),
            // IN p_input_type_category_id SMALLINT(6),
            // IN p_input_type_template_url varchar(255),
            // IN p_input_type_inline_data json,
            // IN p_organization_id BIGINT(20),
            // IN p_log_asset_id BIGINT(20),
            // IN p_log_datetime DATETIME)
            
        let paramsArr = new Array(
            request.input_type_name,
            request.input_type_description,
            request.input_type_category_id,
            request.input_type_template_url,
            JSON.stringify(request.input_type_inline_data),
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        )
        const queryString = util.getQueryString('ds_p1_input_type_master_insert', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
              .then((data) => {
                  responseData = data;
                  error = false;
                 
              })
              .catch((err) => {
                  error = err;
              })
        }
        return [error, responseData];
       
    }

    this.getInPutTypeMaster = async (request) => {

        let responseData = [],
            error = true;
        let paramsArr = new Array(
            request.organization_id,
            request.start_from || 0,
            request.page_limit || 10
        )
        const queryString = util.getQueryString('ds_p1_input_type_master_select', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
              .then((data) => {
                  responseData = data;
                  error = false;
                 
              })
              .catch((err) => {
                  error = err;
              })
        }
        return [error, responseData];
       
    }

    this.inputTypeMasterDelete = async (request) => {

        let responseData = [],
            error = true;
            // IN p_organization_id BIGINT(20), IN p_input_type_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME
        let paramsArr = new Array(
            request.organization_id,
            request.input_type_id,
            request.asset_id,
            util.getCurrentUTCTime()
        )
        const queryString = util.getQueryString('ds_p1_input_type_master_delete', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
              .then(async (data) => {
                  responseData = data;
                  error = false;
                 
              })
              .catch((err) => {
                  error = err;
              })
        }
        return [error, responseData];
       
    }


    this.inputListInsert = async (request) => {

        let responseData = [],
            error = true;

            // IN p_input_name VARCHAR(50),
            // IN p_input_type_id SMALLINT(6),
            // IN p_input_url VARCHAR(255),
            // IN p_input_text VARCHAR(255),
            // IN p_input_inline_data JSON,
            // IN p_input_upload_datetime DATETIME,
            // IN p_organization_id BIGINT(20),
            // IN p_log_asset_id BIGINT(20),
            // IN p_log_datetime DATETIME
            
        let paramsArr = new Array(
            request.input_name,
            request.input_type_id,
            request.input_url,
            request.input_text,
            JSON.stringify(request.input_inline_data),
            util.getCurrentUTCTime(),
            request.organization_id,
            request.asset_id,
            util.getCurrentUTCTime()
        )
        const queryString = util.getQueryString('ds_p1_input_list_insert', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
              .then(async (data) => {
                  responseData = data;
                  error = false;
                  request.input_id = data[0].input_id 
                  request.update_type_id = 2801;
                await this.inputListHistoryInsert(request)
                 
              })
              .catch((err) => {
                  error = err;
              })
        }
        return [error, responseData];
       
    }

    this.inputListInsertV1 = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.input_name,
          request.input_type_id,
          request.input_url1,
          request.input_url2,
          request.input_url3,
          request.input_url4,
          request.input_url5,
          request.input_text,
          request.input_inline_data,
          request.input_upload_datetime,
          request.period_type_id,
          request.data_entity_id,
          request.data_entity_name,
          request.data_entity_type_id,
          request.data_entity_type_name,
          request.period_start_datetime,
          request.period_end_datetime,
          request.workforce_tag_id,
          request.level_id,
          request.product_id,
          request.widget_type_id,
          request.asset_id,
          request.asset_type_id,
          request.organization_id,
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p2_input_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                    request.input_id = data[0].input_id 
                  request.update_type_id = 2801;
                await this.inputListHistoryInsert(request)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.inputListInsertV2 = async function (request) {
        let responseData = [],
            error = true;
        const paramsArr = new Array(
          request.input_name,
          request.input_type_id,
          request.input_url1,
          request.input_url2,
          request.input_url3,
          request.input_url4,
          request.input_url5,
          request.input_text,
          request.input_inline_data,
          request.input_upload_datetime,
          request.period_type_id,
          request.data_entity_id,
          request.data_entity_name,
          request.data_entity_type_id,
          request.data_entity_type_name,
          request.period_start_datetime,
          request.period_end_datetime,
          request.financial_year,
          request.workforce_tag_id,
          request.level_id,
          request.product_id,
          request.widget_type_id,
          request.asset_id,
          request.asset_type_id,
          request.organization_id,
          request.asset_id,
          util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p3_input_list_insert', paramsArr);

        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
                .then(async (data) => {
                    responseData = data;
                    error = false;
                    request.input_id = data[0].input_id 
                  request.update_type_id = 2801;
                await this.inputListHistoryInsert(request)
                })
                .catch((err) => {
                    error = err;
                })
        }
        return [error, responseData];
    }

    this.inputListUpdate = async (request) => {

        let responseData = [],
            error = true;


            // IN p_organization_id BIGINT(20),  
            // IN p_input_id BIGINT(20),
            // IN p_flag_is_processed TINYINT(4),
            // IN p_processed_datetime DATETIME,
            // IN p_log_asset_id BIGINT(20),
            // IN p_log_datetime DATETIME
            
        let paramsArr = new Array(
            request.organization_id,
            request.input_id,
            request.flag_is_processed,
            util.getCurrentUTCTime(),
            request.asset_id,
            util.getCurrentUTCTime()
        )
        const queryString = util.getQueryString('ds_p1_input_list_update_flag_processed', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
              .then(async(data) => {
                  responseData = data;
                  error = false;
                  request.update_type_id = 2803;
                  await this.inputListHistoryInsert(request)
                 
              })
              .catch((err) => {
                  error = err;
              })
        }
        return [error, responseData];
       
    }

    this.inputListDelete = async (request) => {

        let responseData = [],
            error = true;
            
            // IN p_organization_id BIGINT(20), IN p_input_id BIGINT(20), IN p_log_asset_id BIGINT(20), IN p_log_datetime DATETIME

        let paramsArr = new Array(
            request.organization_id,
            request.input_id,
            request.asset_id,
            util.getCurrentUTCTime(),
        )
        const queryString = util.getQueryString('ds_p1_input_list_delete', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
              .then(async(data) => {
                  responseData = data;
                  error = false;
                  request.update_type_id = 2802;
                  await this.inputListHistoryInsert(request)
                 
              })
              .catch((err) => {
                  error = err;
              })
        }
        return [error, responseData];
       
    }

    this.inputListHistoryInsert = async (request) => {

        let responseData = [],
            error = true;
            
            // IN p_organization_id BIGINT(20), IN p_input_id BIGINT(20), IN p_update_type_id INT(11), IN p_update_datetime DATETIME)
        let paramsArr = new Array(
            request.organization_id,
            request.input_id,
            request.update_type_id,
            util.getCurrentUTCTime(),
        )
        const queryString = util.getQueryString('ds_p1_input_list_history_insert', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
              .then((data) => {
                  responseData = data;
                  error = false;
              })
              .catch((err) => {
                  error = err;
              })
        }
        return [error, responseData];
       
    }

    this.getInputList = async (request) => {

        let responseData = [],
            error = true;
            
            // IN p_organization_id BIGINT(20), IN p_input_type_id SMALLINT(6), IN p_start_from SMALLINT(6), IN p_limit_value TINYINT(4)
            let paramsArr = new Array(
                request.organization_id,
                request.input_type_id,           
                request.start_from || 0,
                request.limit_value || 10
            )
        const queryString = util.getQueryString('ds_p1_input_list_select', paramsArr);
        if (queryString !== '') {
            console.log("ds_p1_input_list_select")
            await db.executeQueryPromise(0, queryString, request)
              .then((data) => {
                  responseData = data;
                  error = false;
                  console.log("ds_p1_input_list_select")
                 
              })
              .catch((err) => {
                  error = err;
              })
        }
        return [error, responseData];
       
    }

    this.assetUpdateARPData = async (request) => {

        let responseData = [],
            error = true;

        const paramsArr = [     
            request.organization_id,
            request.target_asset_id,
            request.key,
            request.arp_key_data,
            request.asset_id,
            util.getCurrentUTCTime()
        ];

        const queryString = util.getQueryString('ds_p1_1_asset_list_update_arp_scores', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(0, queryString, request)
              .then((data) => {
                  responseData = data;
                  error = false;
              })
              .catch((err) => {
                  error = err;
              })
        }

        return [error, responseData];
    } 
}

module.exports = AssetConfigService;

