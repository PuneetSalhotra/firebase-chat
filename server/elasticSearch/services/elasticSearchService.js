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
    var documentversion = 1;
    let paramsArray;
    paramsArray =
      new Array(
        request.organization_id,
        request.product,
        request.document_title,
        request.document_desc,
        documentversion,
        request.file_title,
        url,
        request.asset_id
      )
    results[0] = await db.callDBProcedure(request, 'ds_p1_document_insert', paramsArray, 0);

    const result = await client.index({
      index: 'documentrepository',
      type: "_doc",
      body: {
        "id": results[0][0]['id'],
        "orgid": request.organization_id,
        "product": request.product,
        "content": documentcontent,
        "documentdesc": request.document_desc,
        "documenttitle": request.document_title,
        "filetitle": request.file_title
      }
    })
    resultObj['id'] = results[0][0]['id']
    resultObj['version_id'] = documentversion
    return res.status(200).json({
      response : resultObj
  })
  }

  async function updateDocumetInformation(request, documentcontent, url, client, res) {
    let results = new Array();
    var resultObj = {}
    let paramsArray;
    paramsArray =
      new Array(
        request.id,
        request.organization_id,
        request.product,
        request.document_title,
        request.document_desc,
        request.file_title,
        url,
        request.asset_id
      )
    results[0] = await db.callDBProcedure(request, 'ds_p1_document_alter', paramsArray, 0);
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
            "filetitle": request.file_title
          }
        }
      }
    })
    resultObj['id'] = request.id
    resultObj['version_id'] = results[0][0]['document_version_val']
    if(results[0][0]['document_version_val'] != null){
      return res.status(200).json({
        response : resultObj
    })
    }else{
      return res.status(200).json({
        response : 'invalid id'
      })
    }
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
            request.id
          );
        results[0] = await db.callDBProcedure(request, 'ds_p1_document_delete', paramsArray, 1);

        return result
      } catch (error) {
        return Promise.reject(error);
      }
    }


  this.getResult =
    async (request) => {
      try {
        var operator = 'and';
        var searchFields = []
        if(request.hasOwnProperty('fields') && request.fields.length>0){
          searchFields = request.fields;
        }else{
          searchFields = ["product", "content", "documentdesc", "documenttitle", "filetitle"];
        }
        console.log(request.fields)
        console.log(searchFields)
        if(request.hasOwnProperty('search_option') && request.search_option.length>0){
          operator = request.search_option;
        }
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
                          "fields": searchFields ,
                          "operator": operator
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        })
        var ids = []
        for (var i = 0; i < result.body.hits['hits'].length; i++) {
          ids.push(result.body.hits['hits'][i]['_source']['id'])
        }
        let results = new Array();
        let paramsArray;

        paramsArray =
          new Array(
            ids
          );
        results[0] = await db.callDBProcedure(request, 'ds_p1_document_select', paramsArray, 1);
        return results[0];
      } catch (error) {
        return Promise.reject(error);
      }
    };
}



module.exports = CommnElasticService;