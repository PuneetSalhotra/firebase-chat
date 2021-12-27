/*
    author: Puneet Salhotra
*/

function AnalyticsOpsService(objectCollection) 
{    
    const util = objectCollection.util;
    const db = objectCollection.db;        
    const self = this;

    // Add filter label for the organization
    this.addApplicationMaster =
    async (request) => {
        try {
            let results = new Array();
            let paramsArray;

            paramsArray =
                new Array
                    (
                        request.application_name,
                        request.application_visibility_enabled,
                        request.application_label_name,
                        request.tag_type_label_name,
                        request.organization_id,
                        util.getCurrentUTCTime()
                    );

            results[0] = await db.callDBProcedureR2(request, 'ds_p1_application_master_insert', paramsArray, 0);

            return results[0];
        }
        catch (error) {
            return Promise.reject(error);
        }
    };

    this.addTagTypeList =
    async (request) => {
        try {
            let results = new Array();
            let paramsArray;

            paramsArray =
                new Array
                    (
                        request.tag_type_name,
                        request.tag_type_description,
                        request.tag_type_category_id,
                        request.tag_type_sequence_id,
                        request.application_id,
                        request.export_enabled,
                        request.dashboard_enabled,
                        request.organization_id,
                        request.asset_id,
                        util.getCurrentUTCTime()
                    );

            results[0] = await db.callDBProcedureR2(request, 'ds_p2_tag_type_list_insert', paramsArray, 0);

            return results[0];
        }
        catch (error) {
            return Promise.reject(error);
        }
    };

    this.fetchWidgetTypeMaster =
    async (request) => {
        try {
            let paramsArray;
            
            paramsArray =
                new Array
                    (
                        request.organization_id,
                        request.flag || 0,
                        request.page_start || 0,
                        request.page_limit || 50
                    );

            let results = await db.callDBProcedureR2(request, 'ds_p1_widget_filter_master_select', paramsArray, 1);

            return results;
        }
        catch (error) {
            return Promise.reject(error);
        }
    };

    this.insertTagTypeFilterMapping =
    async (request) => {
        try {
            let paramsArray;
            
            paramsArray =
                new Array
                    (
                        request.tag_type_filter_label,
                        request.tag_type_id,
                        request.filter_id,
                        request.filter_sequence_id,
                        request.filter_inline_data,
                        request.filter_access_flag,
                        request.target_activity_type_id,
                        request.target_tag_type_id,
                        request.organization_id,
                        request.asset_id,
                        util.getCurrentUTCTime()
                    );

            await db.callDBProcedureR2(request, 'ds_p1_organization_filter_tag_type_mapping_insert', paramsArray, 0);

            return {};
        }
        catch (error) {
            return Promise.reject(error);
        }
    };

    this.insertReportFilter =
    async (request) => {
        try {
            let paramsArray;
            
            paramsArray =
                new Array
                    (
                        request.report_type_id,
                        request.tag_type_filter_label,
                        request.tag_type_id,
                        request.filter_id,
                        request.filter_sequence_id,
                        request.filter_inline_data,
                        request.filter_access_flag,
                        request.organization_id,
                        request.asset_id,
                        util.getCurrentUTCTime()
                    );

            await db.callDBProcedureR2(request, 'ds_p1_report_filter_tag_type_mapping_insert', paramsArray, 0);

            return {};
        }
        catch (error) {
            return Promise.reject(error);
        }
    };


    this.insertWidgetDrilldownHeaderMapping =
    async (request) => {
        try {
            let paramsArray;
            
            paramsArray =
                new Array
                    (
                        request.tag_type_id,
                        request.header_id,
                        request.sequence_id,
                        request.conversion_format,
                        request.organization_id,
                        request.asset_id,
                        util.getCurrentUTCTime()
                    );

            await db.callDBProcedureR2(request, 'ds_p1_widget_drilldown_header_mapping_insert', paramsArray, 0);

            return {};
        }
        catch (error) {
            return Promise.reject(error);
        }
    };

    this.updateWorkforceActivityTypeMapping =
    async (request) => {
        try {
            let paramsArray;
            
            paramsArray =
                new Array
                    (
                        request.organization_id,
                        request.account_id,
                        request.workforce_id,
                        request.activity_type_id,
                        request.workflow_fields,
                        request.asset_id,
                        util.getCurrentUTCTime()
                    );

            await db.callDBProcedureR2(request, 'ds_p1_workforce_activity_type_mapping_update_workflow_fields', paramsArray, 0);

            return {};
        }
        catch (error) {
            return Promise.reject(error);
        }
    };

    this.selectWidgetDrilldownHeaderMapping =
    async (request) => {
        try {
            let paramsArray;
            
            paramsArray =
                new Array
                    (
                        request.organization_id,
                        request.page_start,
                        request.page_limit
                    );

            let result = await db.callDBProcedureR2(request, 'ds_p1_widget_drilldown_header_master_select', paramsArray, 1);

            return result;
        }
        catch (error) {
            return Promise.reject(error);
        }
    };

    this.getTagTypesBasedOnApplication = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_category_id,
            request.application_id,
            request.page_start || 0,
            request.page_limit            
        );
        const queryString = util.getQueryString('ds_p1_tag_type_list_select_application', paramsArr);

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

    //Get the dashboard fields filter list
    this.getDashboardFiledsFilterList = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_type_id,
            request.form_id,
            request.field_id,
            request.flag,
            request.page_start || 0,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_select_filters', paramsArr);

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

    //Update the worforce form field mapping filters
    this.UpdateWorforceFormFieldMappingFilters = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.activity_type_id,
            request.form_id,
            request.field_id,
            request.dashboard_filter_enabled,
            request.filter_sequence_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_workforce_form_field_mapping_update_filter', paramsArr);

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

    //Get Report TagType Mapping details
    this.getReportsTagTypeMapping = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_mapping_id,
            request.report_type_id,
            request.page_start || 0,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_v1_1_report_filter_tag_type_mapping_select', paramsArr);

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

    // Update Report TagType Mapping details
    this.UpdateReportsTagTypeMapping = async (request) => {
        let responseData = [],
            error = true;

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_mapping_id,
            request.report_type_id,
            request.tag_type_filter_label,
            request.filter_sequence_id,
            request.log_asset_id,
            util.getCurrentUTCTime()
        );
        const queryString = util.getQueryString('ds_p1_report_filter_tag_type_mapping_update', paramsArr);

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

module.exports = AnalyticsOpsService;