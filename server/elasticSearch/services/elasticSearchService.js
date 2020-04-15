var path = require('path')
const elasticsearch = require('elasticsearch');
var extract = require('pdf-text-extract')

function CommnElasticService(objectCollection) {
  const util = objectCollection.util;
  const db = objectCollection.db;
  const client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
  });
  this.updateFile =
    async (request) => {
      try {
        var pdfUrl = request.url
        util.downloadS3Object(request, pdfUrl).then(filename => {
          var fileFullPath = global.config.efsPath + filename;
          var filePath = path.join(fileFullPath)
          setTimeout(() => {
            extract(filePath, function (err, documentcontent) {
              if (err) {
                console.dir(err)
                return err
              }
              var result = updateDocumetInformation(request, documentcontent, pdfUrl, client)
              return result
            })
          }, 1000)
        })
        return 'file successfully updated';
      } catch (error) {
        return Promise.reject(error);
      }
    }

  this.addFile =
    async (request) => {
      try {
        var pdfUrl = request.url
       var temp = await util.downloadS3Object(request, pdfUrl).then(filename => {
          var fileFullPath = global.config.efsPath + filename;
          var filePath = path.join(fileFullPath)
          setTimeout(() => {
            extract(filePath, function (err, documentcontent) {
              if (err) {
                console.dir(err)
                return err
              }
              var result = addDocumetInformation(request, documentcontent, pdfUrl, client)
              return result
            })
          }, 1000)
        })
        return 'file successfully uploaded';
      } catch (error) {
        return Promise.reject(error);
      }
    }
  async function addDocumetInformation(request, documentcontent, url, client) {
    let results = new Array();
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
    return result
  }

  async function updateDocumetInformation(request, documentcontent, url, client) {
    let results = new Array();
    let paramsArray;
    paramsArray =
      new Array(
        request.id,
        request.organization_id,
        request.product,
        request.document_title,
        request.document_desc,
        request.documentversion,
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
    return result
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
        results[0] = await db.callDBProcedure(request, 'athmin.ds_p1_document_delete', paramsArray, 1);

        return result
      } catch (error) {
        return Promise.reject(error);
      }
    }


  this.getResult =
    async (request) => {
      try {
        const search_text = request.search_text
        const orgid = request.organization_id
        const result = await client.search({
          index: 'documentrepository',
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
                          "fields": ["product", "content", "documentdesc", "documenttitle", "filetitle"],
                          "operator": "and"
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

        for (var i = 0; i < result.hits['hits'].length; i++) {
          ids.push(result.hits['hits'][i]['_source']['id'])
        }
        let results = new Array();
        let paramsArray;

        paramsArray =
          new Array(
            ids
          );
        results[0] = await db.callDBProcedure(request, 'athmin.ds_p1_document_select', paramsArray, 1);
        return results[0];
      } catch (error) {
        return Promise.reject(error);
      }
    };
}



module.exports = CommnElasticService;