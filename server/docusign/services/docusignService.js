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
  const accessToken =  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjY4MTg1ZmYxLTRlNTEtNGNlOS1hZjFjLTY4OTgxMjIwMzMxNyJ9.eyJUb2tlblR5cGUiOjUsIklzc3VlSW5zdGFudCI6MTU5MTY4Mzc2NSwiZXhwIjoxNTkxNzEyNTY1LCJVc2VySWQiOiIxNzkxNTk5Yy0xOTQ4LTQ1Y2YtODhjYy01ZTI2NjY1ZWI5YWEiLCJzaXRlaWQiOjEsInNjcCI6WyJzaWduYXR1cmUiLCJjbGljay5tYW5hZ2UiLCJvcmdhbml6YXRpb25fcmVhZCIsInJvb21fZm9ybXMiLCJncm91cF9yZWFkIiwicGVybWlzc2lvbl9yZWFkIiwidXNlcl9yZWFkIiwidXNlcl93cml0ZSIsImFjY291bnRfcmVhZCIsImRvbWFpbl9yZWFkIiwiaWRlbnRpdHlfcHJvdmlkZXJfcmVhZCIsImR0ci5yb29tcy5yZWFkIiwiZHRyLnJvb21zLndyaXRlIiwiZHRyLmRvY3VtZW50cy5yZWFkIiwiZHRyLmRvY3VtZW50cy53cml0ZSIsImR0ci5wcm9maWxlLnJlYWQiLCJkdHIucHJvZmlsZS53cml0ZSIsImR0ci5jb21wYW55LnJlYWQiLCJkdHIuY29tcGFueS53cml0ZSJdLCJhdWQiOiJmMGYyN2YwZS04NTdkLTRhNzEtYTRkYS0zMmNlY2FlM2E5NzgiLCJhenAiOiJmMGYyN2YwZS04NTdkLTRhNzEtYTRkYS0zMmNlY2FlM2E5NzgiLCJpc3MiOiJodHRwczovL2FjY291bnQtZC5kb2N1c2lnbi5jb20vIiwic3ViIjoiMTc5MTU5OWMtMTk0OC00NWNmLTg4Y2MtNWUyNjY2NWViOWFhIiwiYW1yIjpbImludGVyYWN0aXZlIl0sImF1dGhfdGltZSI6MTU5MTY4Mzc2MSwicHdpZCI6IjRlNmYxMTVmLTNkMzAtNGJjMy04OTE0LTkzMjk5NTJhYmZkYiJ9.PQmdRKOfRdVH9hyozQDC07LSz8VcrjjdAsHnvCkfK7FF9eMyh2NP_cHQiMT_TpLeeUg5KD6_F6EqJXAbg_UZKT1JfvS3rGLTSFy_CXHdscYOgIBsEY3Y0TWn4L28FSqp2Ya6pxXIyGwXUOY6GuRVqGjQ9Y5dh_xrTrMvRmd7Fw5tQxbnvTZvfGKeJPlF4WlruJU0Gn7Wxh-XR23SR8EZ3rzL_FLiENnnJ4KIdA7tMCXYODiozYGqWcPHaLqBtMtyAzVsT-bvKXDWPXdj8IDBmQiOctxNn0sXAHOR4wAYQQauXQxW5TeGQD9eBJ_i6OnHASH2hCuolwGXEQRfoS01pw';
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

  try {
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
  paramsArray =
    new Array(
      request.url_path,
      parseInt(request.activity_id) ,
      parseInt(request.asset_id),
      parseInt(request.organization_id),
      parseInt(request.asset_id),
      date,
    )
    if (results) {
        results[0] = await db.callDBProcedure(request, 'ds_v1_activity_docusign_mapping_insert', paramsArray, 0);
        var response = {'activity_document_id':results[0][0]['activity_document_id']}
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
};


module.exports = CommonDocusignService;
