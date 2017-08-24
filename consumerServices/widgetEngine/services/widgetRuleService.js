class WidgetRuleService {
    constructor() {

    }

/*"ds_p1_widget_list_select_form
IN p_organization_id BIGINT(20), IN p_form_id BIGINT(20), IN p_start_from INT(11), IN p_limit_value TINYINT(4)"*/
    getByForm(request){
        return new Promise((resolve, reject) => {
            var paramsArr = new Array(
                request.organization_id,
                request.form_id
            );
            var queryString = util.getQueryString('ds_p1_widget_list_select_form', paramsArr);
            if (queryString === '') return reject();
            db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                /* widget_id, widget_type_id, widget_entity2_id, widget_entity2_data_type_id, 
                widget_entity3_id, widget_entity3_data_type_id, widget_timezone_id, widget_timezone_offset */
                return resolve(data);
            });
        });
    }
}

module.exports = WidgetRuleService;