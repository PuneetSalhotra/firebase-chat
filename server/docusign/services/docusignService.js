var xml2js       = require('xml2js');
var parser  = new xml2js.Parser();


// var parser = require('xml2json');
const pdf2base64 = require('pdf-to-base64');
const superagent = require('superagent')
const docusign = require('docusign-esign');
const puppeteer = require("puppeteer");
const path = require('path');
const fs = require('fs');
const { json } = require('express');
const process = require('process'),
  basePath = 'https://demo.docusign.net/restapi',
  express = require('express'),
  envir = process.env;

function CommonDocusignService(objectCollection) {
  const util = objectCollection.util;
  const db = objectCollection.db;
  var responseWrapper = objectCollection.responseWrapper;

  this.addFile = async (request, res) => {
    // generate refresh token
    await getAccessTokenUsingRefreshToken(accessToken => {
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
      getHtmlToBase64(request).then(async pdfBase64 => {
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
          return Promise.reject(e);
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
            results.status,
            request.activity_id
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
          return res.send(responseWrapper.getResponse(false, response, 200, request));
        }
      })
    })
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
          "activity_id":results[0][i]['activity_id'],
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
      var envelopeStatus =  request.docusignenvelopeinformation.envelopestatus[0]
      var envelopeId = envelopeStatus.envelopeid[0]
      var status = envelopeStatus.status[0]
      var time = envelopeStatus.completed[0]
      var results =[]
     let  paramsArray =
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
    // read and decrypt the refresh token
    // const refreshToken = new Encrypt(dsConfig.refreshTokenFile).decrypt();
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
    authReq.end(function (err, authRes) {
        if (err) {
          return callback(err, authRes);
        } else {
            const accessToken = authRes.body.access_token;
            const refreshToken = authRes.body.refresh_token;
            const expiresIn = authRes.body.expires_in;
            return callback(accessToken)
        }
      })
  }

  async function getHtmlToBase64(request) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(request.url_path, {
      waitUntil: "networkidle2"
    });
    await page.setViewport({ width: 1680, height: 1050 });
    const todays_date = new Date();
    var filename =  todays_date.getTime() + '.pdf';
    await page.pdf({
      path: `${path.join(__dirname, '../files', filename)}`,
      format: "A4"
    });
    await browser.close();
    const pdfBytes = fs.readFileSync(path.resolve(__dirname, '../files', filename))
    , pdfBase64 = pdfBytes.toString('base64');
    return pdfBase64
  }

};

module.exports = CommonDocusignService;
