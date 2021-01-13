var path = require('path');
var extract = require('pdf-text-extract');

function CommnElasticService(objectCollection) {
    const util = objectCollection.util;
    const db = objectCollection.db;
    var responseWrapper = objectCollection.responseWrapper;
    var elasticsearch = require('elasticsearch');
    var client = new elasticsearch.Client({
        hosts: [global.config.elastiSearchNode]
    });

    this.updateFile =
        async (request,res) => {
            try {
                var pdfUrl = request.url_path;
                util.downloadS3Object(request,pdfUrl).then(filename => {
                    var fileFullPath = global.config.efsPath + filename;
                    var filePath = path.join(fileFullPath);
                    setTimeout(() => {
                        extract(filePath,function (err,documentcontent) {
                            if(err) {
                                console.dir(err);
                                return err;
                            }
                            var result = updateDocumetInformation(request,documentcontent,pdfUrl,client,res)
                            return result;
                        });
                    },1000);
                });
            } catch(error) {
                return Promise.reject(error);
            }
        }

    this.addFile =
        async (request,res) => {
            try {
                var pdfUrl = request.url_path;
                var temp = await util.downloadS3Object(request,pdfUrl).then(filename => {
                    var fileFullPath = global.config.efsPath + filename;
                    var filePath = path.join(fileFullPath);
                    setTimeout(() => {
                        extract(filePath,function (err,documentcontent) {
                            if(err) {
                                console.dir(err);
                                return err;
                            }
                            var result = addDocumetInformation(request,documentcontent,pdfUrl,client,res);
                            return result;
                        });
                    },1000);
                });
            } catch(error) {
                return Promise.reject(error);
            }
        };

    async function addDocumetInformation(request,documentcontent,url,client,res) {
        let results = new Array();
        var resultObj = {}
        var document_version = 1;
        let date = new Date().toISOString().slice(0,19).replace('T',' ');

        var filename = url.substring(url.lastIndexOf("/") + 1,url.length);
        let paramsArray;
        paramsArray =
            new Array(
                request.file_title,
                request.document_desc,
                document_version,
                url,
                parseInt(request.activity_id),
                parseInt(request.asset_id),
                parseInt(request.organization_id),
                parseInt(request.asset_id),
                date,
            )
        results[0] = await db.callDBProcedure(request,'ds_v1_activity_document_mapping_insert',paramsArray,0);

        paramsArray =
            new Array(
                parseInt(request.organization_id),
                results[0][0]['activity_document_id'],
                0,
                date,
            )
        try {
            results[1] = await db.callDBProcedure(request,'ds_v1_activity_document_mapping_history_insert',paramsArray,0);
        } catch(error) {
            console.error(error);

        }
        const result = await client.index({
            index: 'documentrepository',
            type: "_doc",
            body: {
                "id": results[0][0]['activity_document_id'],
                "orgid": request.organization_id,
                "filename": filename,
                "product": request.product,
                "content": documentcontent,
                "documentdesc": request.document_desc,
                "documenttitle": request.document_title,
                "filetitle": request.file_title,
                "productid": request.activity_id,
                "s3url": url,
                "assetid": request.asset_id
            }
        });
        resultObj['document_id'] = results[0][0]['activity_document_id'];
        return res.send(responseWrapper.getResponse(false,resultObj,200,request));
    }

    async function updateDocumetInformation(request,documentcontent,url,client,res) {
        let results = new Array();
        var resultObj = {}
        let paramsArray;
        let version_id = 1;
        var filename = url.substring(url.lastIndexOf("/") + 1,url.length);
        let date = new Date().toISOString().slice(0,19).replace('T',' ');
        paramsArray = new Array(
            parseInt(request.organization_id),
            parseInt(request.activity_id),
            parseInt(request.document_id || request.id)
        )

        let error,responseData = [];
        const queryString = util.getQueryString(
            "ds_p1_activity_document_mapping_select",
            paramsArray,
            1
        );
        if(queryString !== "") {
            await db
                .executeQueryPromise(1,queryString,request)
                .then(data => {
                    responseData = data;
                    error = false;
                })
                .catch(err => {
                    error = err;
                });
        }
        if(responseData.length > 0) {

            paramsArray =
                new Array(
                    parseInt(request.organization_id),
                    parseInt(request.activity_id),
                    parseInt(request.document_id || request.id),
                    request.document_title,
                    request.document_desc,
                    url,
                    version_id,
                    parseInt(request.asset_id),
                    date
                )
            results[0] = await db.callDBProcedure(request,'ds_p1_activity_document_mapping_update',paramsArray,0);

            const result = await client.updateByQuery({
                index: 'documentrepository',

                "body": {
                    "query": {
                        "match": {
                            "id": request.document_id || request.id
                        }
                    },
                    "script": {
                        "source": "ctx._source = params",
                        "lang": "painless",
                        "params": {
                            "id": request.document_id || request.id,
                            "orgid": request.organization_id,
                            "product": request.product,
                            "content": documentcontent,
                            "documentdesc": request.document_desc,
                            "documenttitle": request.document_title,
                            "filetitle": request.file_title,
                            "productid": request.activity_id,
                            "s3url": url,
                            "assetid": request.asset_id,
                            "filename": filename
                        }
                    }
                }
            })

            paramsArray =
                new Array(
                    parseInt(request.organization_id),
                    parseInt(request.document_id || request.id),
                    2301,
                    date,
                )
            try {
                results[1] = await db.callDBProcedure(request,'ds_v1_activity_document_mapping_history_insert',paramsArray,0);
            } catch(error) {
                console.error(error)

            }
            resultObj['document_id'] = request.document_id || request.id
            res.send(responseWrapper.getResponse(false,resultObj,200,request));
        } else {
            var err = 'data not found'
            res.send(responseWrapper.getResponse(err,{},-9998,request));
        }
    }


    this.deleteFile =
        async (request) => {
            try {
                let date = new Date().toISOString().slice(0,19).replace('T',' ');
                var resultObj = {}
                paramsArray = new Array(
                    parseInt(request.organization_id),
                    parseInt(request.activity_id),
                    parseInt(request.id)
                )
                const queryString = util.getQueryString(
                    "ds_p1_activity_document_mapping_select",
                    paramsArray,
                    1
                );
                if(queryString !== "") {
                    await db
                        .executeQueryPromise(1,queryString,request)
                        .then(data => {
                            responseData = data;
                            error = false;
                        })
                        .catch(err => {
                            error = err;
                        });
                }
                if(responseData.length > 0) {


                    const result = await client.deleteByQuery({
                        index: 'documentrepository',
                        body: {
                            "query": {
                                "match": {
                                    "id": request.id
                                }
                            }
                        }
                    })

                    let results = new Array();
                    let paramsArray;
                    paramsArray =
                        new Array(
                            parseInt(request.organization_id),
                            parseInt(request.activity_id),
                            parseInt(request.id),
                            parseInt(request.asset_id),
                            date
                        );

                    results[0] = await db.callDBProcedure(request,'ds_p1_activity_document_mapping_delete',paramsArray,0);

                    paramsArray =
                        new Array(
                            parseInt(request.organization_id),
                            parseInt(request.id),
                            2302,
                            date,
                        )
                    try {
                        results[1] = await db.callDBProcedure(request,'ds_v1_activity_document_mapping_history_insert',paramsArray,0);
                    } catch(error) {
                        console.error(error);
                    }
                    return resultObj;
                } else {
                    var err = {};
                    err = 'data not found';
                    res.send(responseWrapper.getResponse(err,{},-9998,request));
                }
            } catch(error) {
                return Promise.reject(error);
            }
        };


    this.getResult = async (request) => {
        let error = true,
            responseData = [];

        try {
            var flag = true;
            var responseObj = {};
            var responseArray = [];
            var dynamicQuery = {};
            var dynamicQueryArray = [];
            var queryType = "cross_fields";
            const validSearchFields = ["product","content","documentdesc","documenttitle","filetitle","filename"];
            var operator = 'and';
            var page_size = 50;
            var page_no = 0;

            if(request.hasOwnProperty('page_size')) {
                page_size = request.page_size;
            }

            if(request.hasOwnProperty('page_no')) {
                page_no = request.page_no;
            }

            var pagination = {};
            pagination['size'] = page_size,
                pagination['from'] = page_no;

            var searchFields = [];

            if(request.hasOwnProperty('fields') && request.fields.length > 0) {
                for(var i = 0; i < request.fields.length; i++) {
                    if(validSearchFields.includes(request.fields[i])) {
                        searchFields.push(request.fields[i]);
                    } else {
                        flag = false;
                        return request.fields[i] + ' fields is not valid';
                        //break;
                    }
                }
            } else {
                searchFields = ["product","content","documentdesc","documenttitle","filetitle","filename"];
            }

            if(request.hasOwnProperty('search_option') && request.search_option.length > 0) {
                if(request.search_option == 'EXACT_SEARCH') {
                    queryType = "phrase";
                } else {
                    operator = request.search_option;
                }
            }
            if(flag) {
                const orgid = request.organization_id;
                var orgFilter = {
                    "match": {
                        "orgid": orgid
                    }
                };

                dynamicQueryArray.push(orgFilter);
                var idFilter = '';

                if(request.hasOwnProperty('id') && request.id != null && request.id != '') {
                    idFilter = {
                        "match": {
                            "id": request.id
                        }
                    };
                    dynamicQueryArray.push(idFilter);
                }
                if(request.hasOwnProperty('search_text') &&
                    request.search_text != null &&
                    request.search_text != '') {
                    let searchText = (request.search_text).toString();

                    if(request.search_text == null || request.search_text.length < 3) {
                        flag = false;
                        let error_msg = 'minimum 3 char required for search';
                        responseData.push({"error_msg": error_msg});

                        return [error,responseData];
                        //return res.send(responseWrapper.getResponse(false, { "error_msg": error_msg }, -9998, request));

                    } else if(searchText === 'true' || searchText.includes('=')) {
                        flag = false;
                        let error_msg = 'seems like malicious search!';
                        responseData.push({"error_msg": error_msg});

                        return [error,responseData];
                        //return res.send(responseWrapper.getResponse(false, { "error_msg": error_msg }, -9998, request));

                    } else {
                        const search_text = (request.search_text).toString();

                        const pattrn = new RegExp(/^[a-zA-Z0-9@_. -]*$/);// allow only number alpha numberic and spaces
                        const searchTextError = !pattrn.test(search_text);
                        if(searchTextError) {
                            flag = false;
                            let error_msg = 'seems like malicious search!';
                            responseData.push({"error_msg": error_msg});
                            return [error,responseData];
                        }

                        console.log('typeof search_text : ',typeof search_text);
                        console.log('search_text : ',search_text);

                        dynamicQueryArray.push({
                            "bool": {
                                "should": {
                                    "multi_match": {
                                        "query": search_text,
                                        "type": queryType,
                                        "fields": searchFields,
                                        "operator": operator
                                    }
                                }
                            }
                        });
                    }
                }

                var query = {};
                var mainQueryObj = {};
                var quertObjArray = {};
                quertObjArray['must'] = dynamicQueryArray;

                mainQueryObj['bool'] = quertObjArray;
                query['query'] = mainQueryObj;

                if(!request.hasOwnProperty('id')) {
                    query = Object.assign(query,pagination);
                }

                console.log('queryType : ',queryType);
                console.log('searchFields : ',searchFields);
                console.log('operator : ',operator);
                console.log('QUERY : ',query);
                console.log('dynamicQueryArray : ',dynamicQueryArray);

                const result = await client.search({
                    index: 'documentrepository',
                    type: "_doc",
                    body: query
                });

                for(let j = 0; j < result.hits['hits'].length; j++) {
                    var obj = {};
                    obj['id'] = result.hits['hits'][j]['_source']['id'];
                    obj['orgid'] = result.hits['hits'][j]['_source']['orgid'];
                    obj['product'] = result.hits['hits'][j]['_source']['product'];
                    obj['documentdesc'] = result.hits['hits'][j]['_source']['documentdesc'];
                    obj['documenttitle'] = result.hits['hits'][j]['_source']['documenttitle'];
                    obj['assetid'] = result.hits['hits'][j]['_source']['assetid'];
                    obj['s3url'] = result.hits['hits'][j]['_source']['s3url'];
                    obj['productid'] = result.hits['hits'][j]['_source']['productid'];
                    obj['filename'] = result.hits['hits'][j]['_source']['filename'];
                    obj['activity_id'] = result.hits['hits'][j]['_source']['productid'];

                    responseArray.push(obj);
                }

                //responseObj['response'] = responseArray;
                return [false,responseArray];
            }
        } catch(error) {
            //return Promise.reject(error);
            return [error,[]];
        }
    };

    this.getAccountName = async(request) => {
        let error = false;
        let responseData = await client.search({
            index: 'crawling_group_accounts',
            body: {
                query: {
                    match: {activity_title_expression : request.activityTitleExpression}
                }
            }
        });

        return [error, responseData];
    };

    this.insertAccountName = async(request) => {
        let error = false;
        let responseData = await client.index({
            index: 'crawling_group_accounts',
            body: {
                organization_id: Number(request.organization_id),
                account_id: Number(request.account_id),
                workforce_id: Number(request.workforce_id),
                asset_id: Number(request.asset_id),
                activity_title: request.activity_title,
                activity_title_expression : request.activityTitleExpression,
                activity_id: request.workflow_activity_id
            }
        });
        return [error, responseData];
    };

    //Inserting the generated code received back from the workflow creation request
    this.updateAccountCode = async(request, accountCode, activityTitleExpression) => {
        let error = false,
            responseData = [];

        client.index({
            index: 'crawling_accounts',
            body: {
                activity_cuid_3: accountCode,
                activity_type_id: Number(request.activity_type_id),
                workforce_id: Number(request.workforce_id),
                account_id: Number(request.account_id),
                activity_id: Number(request.workflow_activity_id),
                asset_id: Number(request.asset_id),
                activity_title_expression: activityTitleExpression,
                activity_cuid_1:request.cuid_1,
                activity_cuid_2:request.cuid_2
                //operating_asset_first_name: "Sagar Pradhan",
                //activity_title: "GALAXY MEDICATION",
                //activity_type_name: "Account Management - SME",
                //asset_first_name: "Channel Head",
                //operating_asset_id: 44574,                
            }
        });

        return [false, responseData];
    };

    this.getVidmData = async(request) => {
        const searchString = (request.search_string).toLowerCase();
        console.log('Search Key - ', searchString);    

        const flag = Number(request.flag);
        console.log('Flag - ', flag);

        //Flag
            //1: account code
            //2: customer name
            //3: date range

        let result;
        switch(flag) {
            case 1: console.log('Searching Acount Code...');
                    result = await client.search({
                                    index: 'vidm',
                                    body: {
                                    size : request.page_size,
                                    from : request.page_no,
                                        "query": {
                                            "match": {
                                                "account_code": request.search_string,
                                            }
                                        }
                                    }
                                });
                    break;

            case 2: console.log('Searching Customer Name...');
                    result = await client.search({
                                    index: 'vidm',
                                    body: {
                                    size : request.page_size,
                                    from : request.page_no,
                                        "query": {
                                            "match": {
                                                "CustomerName": request.search_string,
                                            }
                                        }
                                    }
                                });
                    break;
            
            case 3: console.log('Searching for Date Range...');
                    result = await client.search({
                                    index: 'vidm',
                                    body: {
                                    size : request.page_size,
                                    from : request.page_no,
                                        "query": {
                                            "match": {                                                
                                                "RequestInitiationDate": request.from_date
                                            }
                                        }
                                    }
                                });
                    break;
        }
        //console.log("res",result);
        /*const result = await client.search({
            index: 'vidm',
            body: {
            size : request.page_size,
            from : request.page_no,
                "query": {
                    "multi_match": {
                        "query": request.search_string,
                        "fields" : ["account_code", "account_name"]
                    }
                }
            }
        });*/

        //console.log(result);
        //console.log(result.hits.hits);

        let finalResp = [];

        if(flag !== 3) {
            for(let row of result.hits.hits) {
                //console.log((row._source.account_code).toLowerCase());
                //console.log((row._source.CustomerName).toLowerCase());
                //console.log(' ');
    
                if(flag === 1 && searchString === (row._source.account_code).toLowerCase()) {
                //if(flag === 1) {
                    console.log(`${searchString} is found!`);
                    console.log('Account Code - ', row._source.account_code);

                    finalResp.push(row._source);
                } //else if(flag === 2 && searchString === (row._source.CustomerName).toLowerCase()) {
                else if(flag === 2) {
                    console.log(`${searchString} is found!`);
                    console.log('Customer Name - ', row._source.CustomerName);

                    finalResp.push(row._source);
                }            
            }
        } else {
            for(let row of result.hits.hits) {
                //Element found
                console.log(`${searchString} is found!`);
                finalResp.push(row._source);                
                }
          }

        return [false, finalResp];
    };
}



module.exports = CommnElasticService;
