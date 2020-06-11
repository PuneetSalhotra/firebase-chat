const pdf2base64 = require('pdf-to-base64');
const docusign = require('docusign-esign')
    , path = require('path')
    , fs = require('fs')
    , process = require('process')
    , basePath = 'https://demo.docusign.net/restapi'
    , express = require('express')
    , envir = process.env
    ;
const AWS = require('aws-sdk');
var extract = require('pdf-text-extract')

function CommonDocusignService(objectCollection) {
    const util = objectCollection.util;
    const db = objectCollection.db;
    var responseWrapper = objectCollection.responseWrapper;
    const path = require('path')
    const fs = require('fs')

this.addFile = async  (request, res) => {
        // const qp =request.query;
  const accessToken =  'eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQoAAAABAAUABwCAX58BKA3YSAgAgJ_CD2sN2EgCADpXF5O9cGROpO4gGSmfY5UVAAEAAAAYAAEAAAAFAAAADQAkAAAANjM0NDkyNWUtM2E5Zi00MTUzLWJhNGUtZWJiYTI2MGI3NmQ1IgAkAAAANjM0NDkyNWUtM2E5Zi00MTUzLWJhNGUtZWJiYTI2MGI3NmQ1MACA20DPkAnYSDcAvzcuPDOkJk2_9oYHzAKKxQ.b_MMdI3KJE4eqTkVBRnu4kgYkNpMI32BJgnLOgVVSlioYoBezLDUrDF8jtbDwCwPn9_5pn-2aw2gJeXlEJT8y5LEpxtr4jmghUOSDF9QeKEZmhPC-bto9yzuAreSyVozrWTJzrHHADnXbnQWymGghFcgeJEVSEJD28aRbFPKqJ1R7P6sF_VaFoRsfWblJN8BYzorJi_ONvyZByCLurt0hyqW5Or1PjQ80bwUMMZj1ddGeyIWBhtRWQNsb_t1P6SCFdLdSDG4Rl_dEHSIJCXTScs-oYPH5zPRs6v-zfONTXZ9EkX38Bbs_XA9RmUOFSTmr3eWXY37cxP96t_pbXI18w';
  const accountId =  global.config.accountId; 
  const signerName =  request.receiver_name || 'ajay' ;
  const signerEmail = request.receiver_email || 'ajayp@athmin.com' ;
  const fileName = 'ajay.pdf';
//   const fileName = testurl(request,request.url_path)
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(basePath);
  apiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
  // Set the DocuSign SDK components to use the apiClient object
  docusign.Configuration.default.setDefaultApiClient(apiClient);

  // Create the envelope request
  // Start with the request object
  const envDef = new docusign.EnvelopeDefinition();
  //Set the Email Subject line and email message
  envDef.emailSubject =  request.subject || global.config.documentTypes.customerApplicationForm.emailSubject || 'Please sign this document sent from the Node example';
  envDef.emailBlurb = global.config.documentTypes.customerApplicationForm.emailBlurb || 'Please sign this document sent from the Node example.'
  // Read the file from the document and convert it to a Base64String
//   const pdfBytes = fs.readFileSync(path.resolve(__dirname, fileName))
    //   , pdfBase64 = pdfBytes.toString('base64');
      try{
        var pdfBase64 =await getPdftoBase64(request,request.url_path)
      }catch (e){
          console.log(e)
      }
  // Create the document request object
  const doc = docusign.Document.constructFromObject({documentBase64: pdfBase64,
        fileExtension: 'pdf',  // You can send other types of documents too.
        name: 'test.pdf', documentId: '1'});
  // Create a documents object array for the envelope definition and add the doc object
  envDef.documents = [doc];

  // Create the signer object with the previously provided name / email address
  const signer = docusign.Signer.constructFromObject({name: signerName,
        email: signerEmail, routingOrder: '1', recipientId: '1'});
  // Create the signHere tab to be placed on the envelope
  const signHere = docusign.SignHere.constructFromObject(global.config.documentTypes.customerApplicationForm.signHereTabs || {documentId: '1',
        pageNumber: '1', recipientId: '1', tabLabel: 'SignHereTab',
        xPosition: '195', yPosition: '147'});
  // Create the overall tabs object for the signer and add the signHere tabs array
  // Note that tabs are relative to receipients/signers.
  signer.tabs = docusign.Tabs.constructFromObject({signHereTabs: [signHere]});

  // Add the recipients object to the envelope definition.
  // It includes an array of the signer objects. 
  envDef.recipients = docusign.Recipients.constructFromObject({signers: [signer]});
  // Set the Envelope status. For drafts, use 'created' To send the envelope right away, use 'sent'
  envDef.status = 'sent';

  // Send the envelope
  let envelopesApi = new docusign.EnvelopesApi()
    , results
    ;
    var eventNotification={
      "url": "https://vinnoba.com/perfarm/api/entity/docusign/webhook",
      "loggingEnabled": "true",
      "requireAcknowledgment": "true",
      "useSoapInterface": "false",
      "includeCertificateWithSoap": "false",
      "signMessageWithX509Cert": "false",
      "includeDocuments": "true",
      "includeEnvelopeVoidReason": "true",
      "includeTimeZone": "true",
      "includeSenderAccountAsCustomField": "true",
      "includeDocumentFields": "true",
      "includeCertificateOfCompletion": "true",
      "envelopeEvents": [{
      "envelopeEventStatusCode": "sent"
      },
      {
      "envelopeEventStatusCode": "delivered"
      },
      {
      "envelopeEventStatusCode": "completed"
      },
      {
      "envelopeEventStatusCode": "declined"
      },
      {
      "envelopeEventStatusCode": "voided"
      }
      ],
      "recipientEvents": [{
      "recipientEventStatusCode": "Sent"
      },
      {
      "recipientEventStatusCode": "Delivered"
      },
      {
      "recipientEventStatusCode": "Completed"
      },
      {
      "recipientEventStatusCode": "Declined"
      },
      {
      "recipientEventStatusCode": "AuthenticationFailed"
      },
      {
      "recipientEventStatusCode": "AutoResponded"
      }
      ]
      }
      envDef.eventNotification = eventNotification
      envDef.envelopeIdStamping = true
  try {
    // envDef = Object.assign(envDef,eventNotification)
    results = await envelopesApi.createEnvelope(accountId, {'envelopeDefinition': envDef})
  } catch  (e) {
    let body = e.response && e.response.body;
    if (body) {
      // DocuSign API exception
      res.send (`<html lang="en"><body>
                  <h3>API problem</h3><p>Status code ${e.response.status}</p>
                  <p>Error message:</p><p><pre><code>${JSON.stringify(body, null, 4)}</code></pre></p>`);
    } else {
      // Not a DocuSign exception
      throw e;
    }
  }
  let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  let paramsArray;
  console.log('status',results.status)
  paramsArray =
    new Array(
      request.url_path,
      '',
     results.envelopeId,
     '',
     request.asset_id,
     date,
     date,
     results.status
    )
    if (results) {
        results[0] = await db.callDBProcedure(request, 'docusign_insert', paramsArray, 0);
        var response = {'document_id':results[0][0]['document_id']}
            return response
  }
}

async function getPdftoBase64(request,S3Url){
var pdfBase64 = ''
await pdf2base64(S3Url)
    .then(
        (response) => {
            pdfBase64 = response
        }
    )
    .catch(
        (error) => {
            console.log(error); //Exepection error....
        }
    )
    return pdfBase64
}

this.query = async  (request, res) => {
  try{
    let results=[]
    paramsArray =
    new Array()
      results[0]= await db.callDBProcedure(request, 'docusign_select', paramsArray,1)
      return(results[0])
  }catch(error){
    console.log(error)
  }
}


this.updateStatus = async  (request, res) => {
//  var envStatus = request.DocuSignEnvelopeInformation.EnvelopeStatus
//  var status = envStatus.Status

}
};

module.exports = CommonDocusignService;
