/**
 * author: SBK
 */
class WidgetRuleService {
    constructor(args) {
    }

    getByForm(request, args) {
        return new Promise((resolve, reject) => {
            const limit = 50;

            let rows = [];
            function loop(opts) {
                var paramsArr = new Array(
                        request.organizationId,
                        request.accountId,
                        request.workforceId,
                        request.assetId,
                        request.activityId,
                        request.activityTypeId,
                        request.formId,
                        request.widgetTypeCategoryId,
                        opts.startFrom,                        
                        limit
                        );
                var queryString = args.util.getQueryString('ds_p1_3_widget_list_select_form', paramsArr);
                if (queryString === '')
                    return reject();
                args.db.executeQuery(1, queryString, request, function (err, data) {
                    if (err)
                        return reject(err);
                    rows = rows.concat(data);
                    if (data.length < limit)
                        return resolve(rows);
                    loop({startFrom: rows.length + 1});
                });
            }

            loop({startFrom: 0});

        });
    }
}

module.exports = WidgetRuleService;