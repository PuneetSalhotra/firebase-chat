
class WidgetRuleService {
    constructor(args) {
    }
//TODO   recursive db call
    getByForm(request, args){
        return new Promise((resolve, reject) => {
            const limit = 50;
            let startFrom = 0;
            var paramsArr = new Array(
                request.organizationId,
                request.formId,
                startFrom,
                limit
            );

            var queryString = args.util.getQueryString('ds_p1_widget_list_select_form', paramsArr);
            if (queryString === '') return reject();
            args.db.executeQuery(0, queryString, request, function (err, data) {
                if (err) return reject();
                return resolve(data);
            });
        });
    }
}

module.exports = WidgetRuleService;