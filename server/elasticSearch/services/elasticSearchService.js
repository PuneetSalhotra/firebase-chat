var path = require('path')
const elasticsearch = require('elasticsearch');
var extract = require('pdf-text-extract')
function   CommnElasticService(objectCollection) 
{
    const util = objectCollection.util;
    const db = objectCollection.db;
    const client = new elasticsearch.Client({
      host: 'localhost:9200',
      log: 'error'
    });
    this.test =
    async (request) =>
    {
        try
        {
          const  result  = await client.index({
            index: 'documentrepository',
            type: "_doc",
            body: {
              "id": 23,
              "orgid":request.orgid,
              "product":request.product,
              "content":request.content,
              "documentdesc":request.content,
              "documenttitle":request.documenttitle,
              "filetitle":request.filetitle
            }
          })
          console.log(result)
          return result
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    }

    this.addFile =
    async (request) =>
    {
        try
        {
          var pdfUrl = request.urlpath
          util.downloadS3Object(request, pdfUrl).then(filename=>{
                var fileFullPath = global.config.efsPath + filename;
                var filePath = path.join(fileFullPath)
                 setTimeout(()=>{
                extract(filePath, function (err, pages) {
                if (err) {
                console.dir(err)
                return
                }
                // console.dir(pages)
                var result = saveFileDescription(request, pages, pdfUrl,client)
                console.log('first', result)
                return result
                })
              },1000)
                console.log('done')
                })
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    }
    async function saveFileDescription(request, pages, url, client){
      let results = new Array();
            let paramsArray;
            paramsArray =
            new Array
            (
                request.orgid,
                request.product,
                request.documenttitle,
                request.documentdesc,
                request.documentversion,
                request.filetitle,
                url,
                request.asset_id
            )
          results[0] = await db.callDBProcedure(request, 'ds_p1_document_insert', paramsArray, 0);

          const  result  = await client.index({
              index: 'documentrepository',
              type: "_doc",
              body: {
                "id": results[0][0]['id'],
                "orgid":request.orgid,
                "product":request.product,
                "content":request.content,
                "documentdesc":pages,
                "documenttitle":request.documenttitle,
                "filetitle":request.filetitle
              }
            })
            console.log(result)
            return result
    }

    this.deleteFile =
    async (request) =>
    {
        try
        {
          const  result  = await client.deleteByQuery({
            index: 'documentrepository',
            body: {
              "query": {
                    "match": {
                            "id": request.id
                          }
                  }
          }
          })
          return result
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    }


    this.getResult =
    async (request) =>
    {
        try
        {
            const search_text = request.search_text
            const orgid = request.orgid
            const  result  = await client.search({
              index: 'documentrepository',
              body: {
                "query": {
                  "bool": {
                    "must": [
                      {
                        "match": {
                          "orgid": orgid
                        }
                      },
                      {
                        "bool": {
                          "should": {
                            "multi_match": {
                              "query": search_text,
                              "fields": [ "product", "content" ,"documentdesc","documenttitle","filetitle"],
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
            
            console.log(result.hits['hits'][0]['_source'])

            for(var i=0;i<result.hits['hits'].length;i++){
              ids.push(result.hits['hits'][i]['_source']['id'])
            }
console.log(ids)
            let results = new Array();
            let paramsArray;

            paramsArray = 
            new Array
            (
              ids
                // request.page_start,
                // util.replaceQueryLimit(request.page_limit)
            );
            results[0] = await db.callDBProcedure(request, 'athmin.ds_p1_document_select', paramsArray, 1);
            console.log(results[0])
            return results[0];
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };
}



    module.exports = CommnElasticService;