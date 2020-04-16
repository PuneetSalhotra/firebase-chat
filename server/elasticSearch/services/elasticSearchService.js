var path = require('path')
var extract = require('pdf-text-extract')
function CommnElasticService(objectCollection) {
  const util = objectCollection.util;
  const db = objectCollection.db;
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

    let paramsArray;
    paramsArray =
      new Array(
        request.file_title,
        request.document_desc,
        document_version,
        url,
        request.activity_id ,
        request.asset_id,
        request.organization_id,
        request.log_asset_id,
        request.log_datetime,
      )
    results[0] = await db.callDBProcedure(request, 'ds_v1_activity_document_mapping_insert', paramsArray, 0);

    paramsArray =
      new Array(
        request.organization_id,
        results[0][0]['activity_document_id'],
        request.p_update_type_id,
        request.log_datetime,
      )
        results[1] = await db.callDBProcedure(request, 'ds_v1_activity_document_mapping_history_insert', paramsArray, 0);

    const result = await client.index({
      index: 'documentrepository',
      type: "_doc",
      body: {
        "id": results[0][0]['activity_document_id'],
        "orgid": request.organization_id,
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
    resultObj['id'] = results[0][0]['id']
    resultObj['version_id'] = document_version
    return res.status(200).json({
      response : resultObj
  })
  }

  async function updateDocumetInformation(request, documentcontent, url, client, res) {
    let results = new Array();
    var resultObj = {}
    let paramsArray;
    let version_id = 1;
    paramsArray =
      new Array(
        request.organization_id,
        request.activity_id,
        request.id,
        request.document_title,
        request.document_desc,
        url,
        version_id,
        request.asset_id,
        Date.now()
      )
    results[0] = await db.callDBProcedure(request, 'ds_p1_activity_document_mapping_update', paramsArray, 0);

    paramsArray =
    new Array(
      request.organization_id,
      request.id,
      request.p_update_type_id,
      request.log_datetime,
    )
      results[1] = await db.callDBProcedure(request, 'ds_v1_activity_document_mapping_history_insert', paramsArray, 0);


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
             "assetid": request.asset_id
          }
        }
      }
    })
      return res.status(200).json({
        response : version_id
    })
  }


  this.deleteFile =
    async (request) => {
      try {
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
            request.organization_id,
            request.activity_id,
            request.id,
            request.asset_id,
            request.log_datetime
          );
        results[0] = await db.callDBProcedure(request, 'ds_p1_activity_document_mapping_delete', paramsArray, 1);
      //   paramsArray =
      // new Array(
      //   request.organization_id,
      //   request.id,
      //   request.p_update_type_id,
      //   request.log_datetime,
      // )
      // results[1] = await db.callDBProcedure(request, 'ds_v1_activity_document_mapping_history_insert', paramsArray, 0);

        return result
      } catch (error) {
        return Promise.reject(error);
      }
    }


  this.getResult =
    async (request) => {
      try {
        var flag = true;
        var queryType = "cross_fields"
        const validSearchFields = ["product", "content", "documentdesc", "documenttitle", "filetitle"];
        var operator = 'and';
        var page_size = 50;
        var page_no = 0;
        if(request.hasOwnProperty('page_size')){
          page_size = request.page_size;
        }
        if(request.hasOwnProperty('page_no')){
          page_no = request.page_no;
        }
        var searchFields = []
        console.log(request.fields)
        if(request.hasOwnProperty('fields') && request.fields.length>0){
          for(var i=0;i<request.fields.length;i++){
            if(validSearchFields.includes(request.fields[i])){
              searchFields.push(request.fields[i]);
            }else{
              flag = false
              return request.fields[i]+' fields is not valid'
              break;
            }
          }
        }else{
          searchFields = ["product", "content", "documentdesc", "documenttitle", "filetitle"];
        }
        console.log(request.fields)
        console.log(searchFields)
        if(request.hasOwnProperty('search_option') && request.search_option.length>0){
          if(request.search_option == 'EXACT_SEARCH'){
            queryType = "phrase"
          }else{
            operator = request.search_option;
          }
        }
      if(flag){
        const search_text = request.search_text
        const orgid = request.organization_id
        const result = await client.search({
          index: 'documentrepository',
          type: "_doc",
          body: {
            "query": {
              "bool": {
                "must": [{
                    "match": {
                      "orgid": orgid
                    }
                  },
                  {
                    "bool": {
                      "should": {
                        "multi_match": {
                          "query": search_text,
                          "type": queryType,
                          "fields": searchFields ,
                          "operator": operator
                        }
                      }
                    }
                  }
                ]
              }
            },
            "size": page_size,
            "from": page_no
          }
        })
        // var ids = []
        // for (var i = 0; i < result.body.hits['hits'].length; i++) {
        //   ids.push(result.body.hits['hits'][i]['_source']['id'])
        // }
        // let results = new Array();
        // let paramsArray;
        // paramsArray =
        //   new Array(
        //     request.organization_id,
        //     request.activity_id,
        //     ids
        //   );
        // results[0] = await db.callDBProcedure(request, 'ds_p1_activity_document_mapping_select', paramsArray, 1);
        return result.body.hits['hits'];
      }
      } catch (error) {
        return Promise.reject(error);
      }
    };
}



module.exports = CommnElasticService;