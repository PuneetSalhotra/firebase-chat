const fs = require('fs');
const url = require('url')
const http = require('http')
const pdfparse = require('pdf-parse')
const PDFParser = require("pdf2json");
const parseS3Url = require('parse-s3-url');
const elasticsearch = require('elasticsearch');
var pdfUtil = require('pdf-to-text');
var extract = require('pdf-text-extract')

function   CommnElasticService(objectCollection) 
{
    const util = objectCollection.util;
    const db = objectCollection.db;
    this.test =
    async (request) =>
    {
        try
        {
          
          let files = [];
          var pdfUrl = 'https://worlddesk-staging-2020-04.s3.amazonaws.com/868/984/5403/39602/2020/04/103/pdf_396021586792333949/sample.pdf'
          //  var filename =
              util.downloadS3Object(request, pdfUrl).then(filename=>{
                var fileFullPath = global.config.efsPath + filename;
                console.log(fileFullPath)
                var path = require('path')
                var filePath = path.join(fileFullPath)
                console.log('sdhfkjsf',filePath)
                 extract(filePath, function (err, pages) {
                  console.log('ajay')
                if (err) {
                console.dir(err)
                return
                }
                console.dir(pages)
                })
                console.log('done')
                })
           
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

          var PDFParser = require("pdf2json");
          var pdfUrl = request.url
          var pdfParser = new PDFParser();
          // var documentdesc = ''
  
          // var pdfPipe = requesturl({url: pdfUrl, encoding:null}).pipe(pdfParser);
  
          // pdfPipe.on("pdfParser_dataError", err => console.error(err) );
          // pdfPipe.on("pdfParser_dataReady", pdf => {
          //   let usedFieldsInTheDocument = pdfParser.getAllFieldsTypes();
          //   documentdesc= usedFieldsInTheDocument
          // });


          let data  = util.downloadS3Object(request, request.url)
          const documentdesc = Buffer.from(data.Body).toString('utf8');
          console.log(documentdesc);


          let results = new Array();
            let paramsArray;
            paramsArray =
            new Array
            ( 
                request.orgid,
                request.product,
                documentdesc,
                request.documentdesc,
                request.documentversion,
                request.filetitle,
                request.url,
                request.updateby
            )
          results[0] = await db.callDBProcedure(request, 'ds_p1_document_insert', paramsArray, 0);

          // return results[0]


          const  result  = await client.index({
              index: 'documentrepository',
              type: "_doc",
              body: {
                "id": request.id,
                "orgid":request.orgid,
                "product":request.product,
                "content":request.content,
                "documentdesc":request.documentdesc,
                "documenttitle":request.documenttitle,
                "filetitle":request.filetitle
              }
            })

        }
        catch(error)
        {
            return Promise.reject(error);
        }
    }

    this.deleteFile =
    async (request) =>
    {
        try
        {
             const  results  = await client.delete({
              index: 'documentrepository',
              type: "_doc",
              body: {
                query: {
                    match_phrase: {
                        id: request.id
                    }
                }
            }
            })
            return results
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
            // let documentName = await util.downloadS3Object(request, documentFieldData[0].data_entity_text_1);
            // const documentPath = path.resolve(global.config.efsPath, documentName);
            
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
            console.log(result)
            // let results = new Array();
            // let paramsArray;

            // paramsArray = 
            // new Array
            // (
                // request.page_start,
                // util.replaceQueryLimit(request.page_limit)
            // );
            // results[0] = await db.callDBProcedure(request, 'athmin.ds_p1_document_select', paramsArray, 1);
            
            // console.log(results[0])
            return result;
        }
        catch(error)
        {
            return Promise.reject(error);
        }
    };
}

const client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'error'
  });

    module.exports = CommnElasticService;