var path = require('path')
var extract = require('pdf-text-extract')

function CommnElasticService(objectCollection) {
  const util = objectCollection.util;
  const db = objectCollection.db;
  var responseWrapper = objectCollection.responseWrapper;
  const { Client } = require('@elastic/elasticsearch');
  const { AmazonConnection } = require('aws-elasticsearch-connector');
  const client = new Client({
  node: 'https://vpc-worlddesk-thg4o3ddhlkj4bbkj3tfwiky4a.ap-south-1.es.amazonaws.com',
  Connection: AmazonConnection,
});

  this.updateFile =
    async (request, res) => {
      try {
        var pdfUrl = request.url_path
        util.downloadS3Object(request, pdfUrl).then(filename => {
          var fileFullPath = global.config.efsPath + filename;
          var filePath = path.join(fileFullPath)
          setTimeout(() => {
            extract(filePath, function (err, documentcontent) {
              if (err) {
                console.dir(err)
                return err
              }
              var result = updateDocumetInformation(request, documentcontent, pdfUrl, client, res)
              return result
            })
          }, 1000)
        })
      } catch (error) {
        return Promise.reject(error);
      }
    }

  this.addFile =
    async (request, res) => {
      try {
        var pdfUrl = request.url_path
       var temp = await util.downloadS3Object(request, pdfUrl).then(filename => {
          var fileFullPath = global.config.efsPath + filename;
          var filePath = path.join(fileFullPath)
          setTimeout(() => {
            extract(filePath, function (err, documentcontent) {
              if (err) {
                console.dir(err)
                return err
              }
              var result = addDocumetInformation(request, documentcontent, pdfUrl, client, res)
              return result
            })
          }, 1000)
        })
      } catch (error) {
        return Promise.reject(error);
      }
    }
  async function addDocumetInformation(request, documentcontent, url, client, res) {
    let results = new Array();
    var resultObj = {}
    var document_version = 1;
    let date = new Date().toISOString().slice(0, 19).replace('T', ' ');

    var filename = url.substring(url.lastIndexOf("/") + 1, url.length );
    let paramsArray;
    paramsArray =
      new Array(
        request.file_title,
        request.document_desc,
        document_version,
        url,
        parseInt(request.activity_id) ,
        parseInt(request.asset_id),
        parseInt(request.organization_id),
        parseInt(request.asset_id),
        date,
      )
    results[0] = await db.callDBProcedure(request, 'ds_v1_activity_document_mapping_insert', paramsArray, 0);

    paramsArray =
      new Array(
        parseInt(request.organization_id),
        results[0][0]['activity_document_id'],
        0,
        date,
      )
      try{
        results[1] = await db.callDBProcedure(request, 'ds_v1_activity_document_mapping_history_insert', paramsArray, 0);
      }catch(error){
        console.error(error)

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
    })
    resultObj['document_id'] = results[0][0]['activity_document_id']
     return res.send(responseWrapper.getResponse(false, resultObj, 200, request));
  }

  async function updateDocumetInformation(request, documentcontent, url, client, res) {
    let results = new Array();
    var resultObj = {}
    let paramsArray;
    let version_id = 1;
    var filename = url.substring(url.lastIndexOf("/") + 1, url.length );
    let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    paramsArray= new Array(
      parseInt(request.organization_id),
      parseInt(request.activity_id),
      parseInt(request.id)
    )

  const queryString = util.getQueryString(
    "ds_p1_activity_document_mapping_select",
    paramsArray,
    1
    );
    if (queryString !== "") {
    await db
    .executeQueryPromise(1, queryString, request)
    .then(data => {
    responseData = data;
    error = false;
    })
    .catch(err => {
    error = err;
    });
    }
     if(responseData.length>0){

    paramsArray =
      new Array(
        parseInt(request.organization_id),
        parseInt(request.activity_id),
        parseInt(request.id),
        request.document_title,
        request.document_desc,
        url,
        version_id,
        parseInt(request.asset_id),
        date
      )
    results[0] = await db.callDBProcedure(request, 'ds_p1_activity_document_mapping_update', paramsArray, 0);

    const result = await client.updateByQuery({
      index: 'documentrepository',

      "body": {
        "query": {
          "match": {
            "id": request.id
          }
        },
        "script": {
          "source": "ctx._source = params",
          "lang": "painless",
          "params": {
            "id": request.id,
            "orgid": request.organization_id,
            "product": request.product,
            "content": documentcontent,
            "documentdesc": request.document_desc,
            "documenttitle": request.document_title,
            "filetitle": request.file_title,
            "productid": request.activity_id,
             "s3url": url,
             "assetid": request.asset_id,
             "filename":filename
          }
        }
      }
    })

    paramsArray =
    new Array(
      parseInt(request.organization_id),
      parseInt(request.id),
      2301,
      date,
    )
    try{
       results[1] = await db.callDBProcedure(request, 'ds_v1_activity_document_mapping_history_insert', paramsArray, 0);
    }catch(error){
      console.error(error)

    }
    resultObj['document_id']= request.id
    res.send(responseWrapper.getResponse(false, resultObj, 200, request));
  }else{
      var err ='data not found'
      res.send(responseWrapper.getResponse(err, {}, -9998, request));
    }
  }


  this.deleteFile =
    async (request) => {
      try {
        let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
        var resultObj = {}
        paramsArray= new Array(
          parseInt(request.organization_id),
          parseInt(request.activity_id),
          parseInt(request.id)
        )
        const queryString = util.getQueryString(
          "ds_p1_activity_document_mapping_select",
          paramsArray,
          1
          );
          if (queryString !== "") {
          await db
          .executeQueryPromise(1, queryString, request)
          .then(data => {
          responseData = data;
          error = false;
          })
          .catch(err => {
          error = err;
          });
          }
        if(responseData.length>0){


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

        results[0] = await db.callDBProcedure(request, 'ds_p1_activity_document_mapping_delete', paramsArray, 0);

        paramsArray =
        new Array(
        parseInt(request.organization_id),
        parseInt(request.id),
        2302,
        date,
      )
      try{
      results[1] = await db.callDBProcedure(request, 'ds_v1_activity_document_mapping_history_insert', paramsArray, 0);
      }catch(error){
        console.error(error)
      }
        return resultObj
    }else{
      var err={}
      err ='data not found'
      res.send(responseWrapper.getResponse(err, {}, -9998, request));
    }
      } catch (error) {
        return Promise.reject(error);
      }
    }


  this.getResult =
    async (request) => {
      try {
        var flag = true;
        var responseObj = {}
        var responseArray = []
        var dynamicQuery ={}
        var dynamicQueryArray = []
        var queryType = "cross_fields"
        const validSearchFields = ["product", "content", "documentdesc", "documenttitle", "filetitle", "filename"];
        var operator = 'and';
        var page_size = 50;
        var page_no = 0;
        if (request.hasOwnProperty('page_size')) {
          page_size = request.page_size;
        }
        if (request.hasOwnProperty('page_no')) {
          page_no = request.page_no;
        }
        var pagination ={}
        pagination['size']= page_size,
        pagination['from']= page_no
        var searchFields = []
        if (request.hasOwnProperty('fields') && request.fields.length > 0) {
          for (var i = 0; i < request.fields.length; i++) {
            if (validSearchFields.includes(request.fields[i])) {
              searchFields.push(request.fields[i]);
            } else {
              flag = false
              return request.fields[i] + ' fields is not valid'
              break;
            }
          }
        } else {
          searchFields = ["product", "content", "documentdesc", "documenttitle", "filetitle", "filename"];
        }
        if (request.hasOwnProperty('search_option') && request.search_option.length > 0) {
          if (request.search_option == 'EXACT_SEARCH') {
            queryType = "phrase"
          } else {
            operator = request.search_option;
          }
        }
        if (flag) {
          const orgid = request.organization_id
          var orgFilter = {
            "match": {
              "orgid": orgid
            }
          }
          dynamicQueryArray.push(orgFilter)
          var idFilter = ''
          if (request.hasOwnProperty('id') && request.id != null && request.id != '') {
            idFilter = {
              "match": {
                "id": request.id
              }
            }
            dynamicQueryArray.push(idFilter)
          }
          if (request.hasOwnProperty('search_text') && request.search_text != null &&
            request.search_text != '') {
            if (request.search_text == null || request.search_text.length < 3) {
              flag = false
              var error_msg ='minimum 3 char required for search';
              return res.send(responseWrapper.getResponse(false, {"error_msg":error_msg}, -9998, request));

            } else {
              const search_text = request.search_text
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
          var query={}
          var mainQueryObj ={}
          var quertObjArray={}
          quertObjArray['must']=dynamicQueryArray
          mainQueryObj['bool']=quertObjArray
          query['query']=mainQueryObj
          if (!request.hasOwnProperty('id') || request.id == null || request.id == '') {
            query= Object.assign(query, pagination)
          }

          const result = await client.search({
            index: 'documentrepository',
            type: "_doc",
            body: query
          })

          for (var i = 0; i < result.body.hits['hits'].length; i++) {
            var obj = {}
            obj['id'] = result.body.hits['hits'][i]['_source']['id']
            obj['orgid'] = result.body.hits['hits'][i]['_source']['orgid']
            obj['product'] = result.body.hits['hits'][i]['_source']['product']
            obj['documentdesc'] = result.body.hits['hits'][i]['_source']['documentdesc']
            obj['documenttitle'] = result.body.hits['hits'][i]['_source']['documenttitle']
            obj['assetid'] = result.body.hits['hits'][i]['_source']['assetid']
            obj['s3url'] = result.body.hits['hits'][i]['_source']['s3url']
            obj['productid'] = result.body.hits['hits'][i]['_source']['productid']
            obj['filename'] = result.body.hits['hits'][i]['_source']['filename']
            obj['activity_id'] = result.body.hits['hits'][i]['_source']['productid']
            responseArray.push(obj)
          }
          responseObj['response'] = responseArray
          return responseObj;
        }
      } catch (error) {
        return Promise.reject(error);
      }
    };
  }



module.exports = CommnElasticService;
