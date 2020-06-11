var parser = require('xml2json');
const pdf2base64 = require('pdf-to-base64');
const docusign = require('docusign-esign'),
  process = require('process'),
  basePath = 'https://demo.docusign.net/restapi',
  express = require('express'),
  envir = process.env;

function CommonDocusignService(objectCollection) {
  const util = objectCollection.util;
  const db = objectCollection.db;
  var responseWrapper = objectCollection.responseWrapper;

  this.addFile = async (request, res) => {
    const accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjY4MTg1ZmYxLTRlNTEtNGNlOS1hZjFjLTY4OTgxMjIwMzMxNyJ9.eyJUb2tlblR5cGUiOjUsIklzc3VlSW5zdGFudCI6MTU5MTg0NTg3MiwiZXhwIjoxNTkxODc0NjcyLCJVc2VySWQiOiIxNzkxNTk5Yy0xOTQ4LTQ1Y2YtODhjYy01ZTI2NjY1ZWI5YWEiLCJzaXRlaWQiOjEsInNjcCI6WyJzaWduYXR1cmUiLCJjbGljay5tYW5hZ2UiLCJvcmdhbml6YXRpb25fcmVhZCIsInJvb21fZm9ybXMiLCJncm91cF9yZWFkIiwicGVybWlzc2lvbl9yZWFkIiwidXNlcl9yZWFkIiwidXNlcl93cml0ZSIsImFjY291bnRfcmVhZCIsImRvbWFpbl9yZWFkIiwiaWRlbnRpdHlfcHJvdmlkZXJfcmVhZCIsImR0ci5yb29tcy5yZWFkIiwiZHRyLnJvb21zLndyaXRlIiwiZHRyLmRvY3VtZW50cy5yZWFkIiwiZHRyLmRvY3VtZW50cy53cml0ZSIsImR0ci5wcm9maWxlLnJlYWQiLCJkdHIucHJvZmlsZS53cml0ZSIsImR0ci5jb21wYW55LnJlYWQiLCJkdHIuY29tcGFueS53cml0ZSJdLCJhdWQiOiJmMGYyN2YwZS04NTdkLTRhNzEtYTRkYS0zMmNlY2FlM2E5NzgiLCJhenAiOiJmMGYyN2YwZS04NTdkLTRhNzEtYTRkYS0zMmNlY2FlM2E5NzgiLCJpc3MiOiJodHRwczovL2FjY291bnQtZC5kb2N1c2lnbi5jb20vIiwic3ViIjoiMTc5MTU5OWMtMTk0OC00NWNmLTg4Y2MtNWUyNjY2NWViOWFhIiwiYXV0aF90aW1lIjoxNTkxODQ0OTMzLCJwd2lkIjoiNGU2ZjExNWYtM2QzMC00YmMzLTg5MTQtOTMyOTk1MmFiZmRiIn0.HRvueOWqiwbYCRuUOh1_jFveLxn2AxBT60Ibo9gbg5OHi26IyUUsdSpiZSA4pRdQWjRtSU-W1_QnyU7IdwC4o1H5-Io31iromQFmmuMh2O2q-sRzCb7GsrAfsekpyVnWiS6O1u3yFf8wnVn2UpvzUEwppYldlyv0T8EbLn2RZUagYm7jIzJrY9L7OkK-8JPAFk3OplrtV6wuGPy1-ptsqna__54jpyJx0Qi1CCrTn5OC91OQw1ZI-2v6I5usfMs077fZISat6qUcebJanis4Xs5t_JSky5BfIFXuvP3qxCy62vKp-B6kvA3ZNsftU76HHn2r_hikpQuWgNPHM3iE3g';
    const accountId = global.config.accountId;
    const signerName = request.receiver_name || 'ajay';
    const signerEmail = request.receiver_email || 'ajayp@athmin.com';
    const apiClient = new docusign.ApiClient();
    apiClient.setBasePath(basePath);
    apiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
    // Set the DocuSign SDK components to use the apiClient object
    docusign.Configuration.default.setDefaultApiClient(apiClient);

    // Create the envelope request
    const envDef = new docusign.EnvelopeDefinition();
    //Set the Email Subject line and email message
    envDef.emailSubject = request.subject || global.config.documentTypes.customerApplicationForm.emailSubject || 'Please sign this document sent from the Node example';
    envDef.emailBlurb = global.config.documentTypes.customerApplicationForm.emailBlurb || 'Please sign this document sent from the Node example.'
    // Read the file from the document and convert it to a Base64String
    try {
      var pdfBase64 = await getPdftoBase64(request, request.url_path)
    } catch (e) {
      console.log(e)
    }
    // Create the document request object
    const doc = docusign.Document.constructFromObject({
      documentBase64: pdfBase64,
      fileExtension: 'pdf', // You can send other types of documents too.
      name: 'test.pdf',
      documentId: '1'
    });
    // Create a documents object array for the envelope definition and add the doc object
    envDef.documents = [doc];

    // Create the signer object with the previously provided name / email address
    const signer = docusign.Signer.constructFromObject({
      name: signerName,
      email: signerEmail,
      routingOrder: '1',
      recipientId: '1'
    });
    // Create the signHere tab to be placed on the envelope
    const signHere = global.config.documentTypes.customerApplicationForm.signHereTabs || [{
      documentId: '1',
      pageNumber: '1',
      recipientId: '1',
      tabLabel: 'SignHereTab',
      xPosition: '195',
      yPosition: '147'
    }];
    // Create the overall tabs object for the signer and add the signHere tabs array
    // Note that tabs are relative to receipients/signers.
    signer.tabs = docusign.Tabs.constructFromObject({
      signHereTabs: signHere
    });

    // Add the recipients object to the envelope definition.
    // It includes an array of the signer objects. 
    envDef.recipients = docusign.Recipients.constructFromObject({
      signers: [signer]
    });
    // Set the Envelope status. For drafts, use 'created' To send the envelope right away, use 'sent'
    envDef.status = 'sent';

    // Send the envelope
    let envelopesApi = new docusign.EnvelopesApi(),
      results;
    var eventNotification = {
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
      results = await envelopesApi.createEnvelope(accountId, {
        'envelopeDefinition': envDef
      })
    } catch (e) {
      let body = e.response && e.response.body;
      if (body) {
        // DocuSign API exception
        res.send(`<html lang="en"><body>
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
      var response = {
        'document_id': results[0][0]['doc_id']
      }
      return response
    }
  }

  async function getPdftoBase64(request, S3Url) {
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

  this.query = async (request, res) => {
    try {
      let results = []
      paramsArray =
        new Array()
      results[0] = await db.callDBProcedure(request, 'docusign_select', paramsArray, 1)
      return (results[0])
    } catch (error) {
      console.log(error)
    }
  }


  this.updateStatus = async (request, res) => {
    var xml = '<?xml version="1.0" encoding="utf-8"?><DocuSignEnvelopeInformation xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.docusign.net/API/3.0"><EnvelopeStatus><RecipientStatuses><RecipientStatus><Type>Signer</Type><Email>ajaypalbhagel@gmail.com</Email><UserName>ajay</UserName><RoutingOrder>1</RoutingOrder><Sent>2020-06-10T00:34:00.303</Sent><Delivered>2020-06-10T00:34:34.117</Delivered><Signed>2020-06-10T00:34:40.6</Signed><DeclineReason xsi:nil="true" /><Status>Completed</Status><RecipientIPAddress>103.211.55.175</RecipientIPAddress><CustomFields /><TabStatuses><TabStatus><TabType>SignHere</TabType><Status>Signed</Status><XPosition>406</XPosition><YPosition>263</YPosition><TabLabel>SignHereTab</TabLabel><TabName>SignHere</TabName><TabValue /><DocumentID>1</DocumentID><PageNumber>1</PageNumber></TabStatus></TabStatuses><AccountStatus>Active</AccountStatus><RecipientId>d6a6f9dc-1f18-4856-9c1a-70cc02d5566d</RecipientId></RecipientStatus></RecipientStatuses><TimeGenerated>2020-06-10T00:34:54.4835479</TimeGenerated><EnvelopeID>9973b51a-784d-41bf-8eef-8ef7f4888f75</EnvelopeID><Subject>hello ajay</Subject><UserName>ajay pal</UserName><Email>ajaypalbhagel@gmail.com</Email><Status>Completed</Status><Created>2020-06-10T00:33:59.507</Created><Sent>2020-06-10T00:34:00.337</Sent><Delivered>2020-06-10T00:34:34.24</Delivered><Signed>2020-06-10T00:34:40.6</Signed><Completed>2020-06-10T00:34:40.6</Completed><ACStatus>Original</ACStatus><ACStatusDate>2020-06-10T00:33:59.507</ACStatusDate><ACHolder>ajay pal</ACHolder><ACHolderEmail>ajaypalbhagel@gmail.com</ACHolderEmail><ACHolderLocation>DocuSign</ACHolderLocation><SigningLocation>Online</SigningLocation><SenderIPAddress>103.211.55.175 </SenderIPAddress><EnvelopePDFHash /><CustomFields><CustomField><Name>AccountId</Name><Show>false</Show><Required>false</Required><Value>10725652</Value><CustomFieldType>Text</CustomFieldType></CustomField><CustomField><Name>AccountName</Name><Show>false</Show><Required>false</Required><Value>athmin</Value><CustomFieldType>Text</CustomFieldType></CustomField><CustomField><Name>AccountSite</Name><Show>false</Show><Required>false</Required><Value>demo</Value><CustomFieldType>Text</CustomFieldType></CustomField></CustomFields><AutoNavigation>true</AutoNavigation><EnvelopeIdStamping>true</EnvelopeIdStamping><AuthoritativeCopy>false</AuthoritativeCopy><DocumentStatuses><DocumentStatus><ID>1</ID><Name>test.pdf</Name><TemplateName /><Sequence>1</Sequence></DocumentStatus></DocumentStatuses></EnvelopeStatus></DocuSignEnvelopeInformation>';
        var json = parser.toJson(xml);
        console.log("to json -> %s", json);
        var envelopeStatus = json.DocuSignEnvelopeInformation.EnvelopeStatus
        var envelopeId = envelopeStatus.EnvelopeID
        var status = envelopeStatus.Status
        var time = envelopeStatus.Completed
    paramsArray =
        new Array(
          envelopeId,
          '',
          time,
          status
        )
      results[0] = await db.callDBProcedure(request, 'docusign_update', paramsArray, 0)
      return(results[0])
  }
};

module.exports = CommonDocusignService;
