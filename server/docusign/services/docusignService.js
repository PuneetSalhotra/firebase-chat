var parser = require('xml2json');
const pdf2base64 = require('pdf-to-base64');
const superagent = require('superagent')
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
     //generate refresh token
    //   getAccessTokenUsingRefreshToken(resp=>{
    //    console.log('aaaa',resp)
    //  })

    const accessToken = 'eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQoAAAABAAUABwCAqW1slA7YSAgAgOmQetcO2EgCAJxZkRdIGc9FiMxeJmZeuaoVAAEAAAAYAAEAAAAFAAAADQAkAAAAOTE1MTMwMDItMmZhZC00Y2IzLWFhMWYtNGRlMjRhYWVhNWE0IgAkAAAAOTE1MTMwMDItMmZhZC00Y2IzLWFhMWYtNGRlMjRhYWVhNWE0MACAEGbFtA3YSDcAXxFvTjA9w0uJFJMplSq_2w.22hUdbUksOONf-DPqFgu2FB8-aoewYigDUsyFxU4dTf7mMLvNHrvgZD0-s684FQSBS8KPgJcXGLJH-dH6oqbHgh58gynA8CrUoGNUgWvQ3U2esKh721VV5G-WDi2Z09nCpoUvnpNWkF4_AhlMbzOonX33XjkJ88owcmxK-zcJCB3ytN9kVDYVyf2Bu9ewcvI_Mj2IefR4j8HEAft4M_ZAgSxDPRCVtazrIG_rsnpQ4UTYVBr_wtkV7oEXBoAUDT4qVjs5ISHeStN-N0bzUT5LlSMTtob0C7P7aQoP7uPengq3DeTTkaTrjXgFSzZ97Hk4T_-rtPZtqS90pzcLXkcMA';
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
                  <h3>API problem ajay</h3><p>Status code ${e.response.status}</p>
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
        '',
        request.url_path,
        results.envelopeId,
        request.asset_id,
        date,
        0,
        envDef.emailSubject,
        results.status
      )
    if (results) {
      results[0] = await db.callDBProcedure(request, 'docusign_insert', paramsArray, 0);
      paramsArray =
      new Array(
        signerName,
        signerEmail,
        results[0][0]['doc_id']
      )
      results[1] = await db.callDBProcedure(request, 'docusign_user_details_insert', paramsArray, 0);
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
        new Array(
          request.document_id
        )
      results[0] = await db.callDBProcedure(request, 'docusign_select', paramsArray, 1)
      results[1]=  await db.callDBProcedure(request, 'docusign_user_details_select', paramsArray, 1)
      var responseArray = []
      var obj = {}
      var receiverDetails = {}
      for(var i=0;i<results[0].length;i++){
        for(var j=0;j<results[1].length;j++){
          if(results[0][i]['doc_id']==results[1][j]['doc_id']){
           receiverDetails= {
              "receiver_name": results[1][j]['receiver_name'] || '',
              "receiver_email": results[1][j]['email' || '']
            }
          }
        }

        obj = {
          "document_id":results[0][i]['doc_id'],
          "unsigned_s3_url": results[0][i]['unsigned_doc_url'],
          "signed_s3_url": results[0][i]['signed_doc_url'],
          "document_type": results[0][i]['document_type'] || 'pdf',
          "receiver_details": [receiverDetails],
          "subject": results[0][i]['email_subject'],
          "email_sent_time": results[0][i]['doc_sending_time'],
          "document_signed_time": results[0][i]['signed_doc_receiving_time'],
          "uploaded_by": {
            "asset_id": results[0][i]['asset_id'],
            "name": results[0][i]['name'] || ''
          }
        }
        responseArray.push(obj)
        receiverDetails = {}
        obj = {}
      }
      var response ={
        "documents": responseArray
      }
      return (response)
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

  function getAccessTokenUsingRefreshToken(callback) {
    const clientId = global.config.ClientId;
    const clientSecret = global.config.ClientSecret;
    //read and decrypt the refresh token
    // const refreshToken = new Encrypt(dsConfig.refreshTokenFile).decrypt();
    console.log('step-1')
    const refreshToken =  'eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQoAAAABAAgABwAAk5vxgQ7YSAgAABMA6hQm2EgCAJxZkRdIGc9FiMxeJmZeuaoVAAEAAAAYAAEAAAAFAAAADQAkAAAAOTE1MTMwMDItMmZhZC00Y2IzLWFhMWYtNGRlMjRhYWVhNWE0IgAkAAAAOTE1MTMwMDItMmZhZC00Y2IzLWFhMWYtNGRlMjRhYWVhNWE0MACAEGbFtA3YSDcAXxFvTjA9w0uJFJMplSq_2w.aDwiofmPFF4UFdnwCDXl4GC98J4pL4cAbgUkNKIM27lYtZZA0vlxmKTXZp9t0I6lRscI9aTYy9N9TBcZccwN8R9ecSsDmtrq8fXHCr81m0qZoeYPdx9pr_t4oqjTiZ_fPMK3X1mRlJPdOISSFpSU8MfPNuj0B4bnsAgJstEnh6LMYdOrJ35cFoygJsygbcyWighXHihM2CEQOEhMMujZrIrZk23SAH1Gh9sG_vxwHkYTO9O5jlZ9gbSLEa-X6w5I42vk8LFQ2JcK6c78qwMjnniZp_pMnMILQ_VEkHGidCsSNXI6ZpjyX0r9NvHJoj8BZvurwJFEuM9a-oLZnd51Zw';
    const clientString = clientId + ":" + clientSecret,
    postData = {
        "grant_type": "refresh_token",
        "refresh_token": refreshToken,
      },
    headers = {
        "Authorization": "Basic " + (new Buffer(clientString).toString('base64')),
      },
    authReq = superagent.post( 'https://account-d.docusign.com' + "/oauth/token")
        .send(postData)
        .set(headers)
        .type("application/x-www-form-urlencoded");
        console.log('step-2')
    authReq.end(function (err, authRes) {
      console.log('step-3')
        if (err) {
            console.log("ERROR getting access token using refresh token:");
            console.log(err);
          return callback(err, authRes);
        } else {
          console.log('step-4')
            const accessToken = authRes.body.access_token;
            const refreshToken = authRes.body.refresh_token;
            const expiresIn = authRes.body.expires_in;
            console.log('step 4.0',accessToken)
            return callback(accessToken )
        }
      })
    }
};

module.exports = CommonDocusignService;
