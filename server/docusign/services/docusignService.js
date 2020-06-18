const base64url = require('base64url');
const moment = require("moment");
const superagent = require('superagent')
const docusign = require('docusign-esign');
const puppeteer = require("puppeteer");
const basePath = config.docusignBasePath

function commonDocusignService(objectCollection) {
  const util = objectCollection.util;
  const db = objectCollection.db;
  var responseWrapper = objectCollection.responseWrapper;
  var ActivityTimelineService = require("../../services/activityTimelineService.js");
  const activityTimelineService = new ActivityTimelineService(objectCollection);

  this.addFile = async (request, res) => {
    try {
      await getAccessTokenUsingRefreshToken(accessToken => {
        const accountId = global.config.accountId;
        const signerName = request.receiver_name;
        const signerEmail = request.receiver_email;
        const apiClient = new docusign.ApiClient();
        apiClient.setBasePath(basePath);
        apiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
        docusign.Configuration.default.setDefaultApiClient(apiClient);

        const envDef = new docusign.EnvelopeDefinition();
        envDef.emailSubject = request.subject || global.config.documentTypes.customerApplicationForm.emailSubject;
        if (request.hasOwnProperty('document_type') && global.config.documentTypes.hasOwnProperty(request.document_type)) {
          envDef.emailBlurb = global.config.documentTypes[request.document_type]['emailBlurb'];
        }

        getHtmlToBase64(request, res).then(async pdfResult => {
          const s3UploadUrl = await uploadReadableStreamOnS3(request, pdfResult['pdf'], res)
          const doc = docusign.Document.constructFromObject({
            documentBase64: pdfResult['pdfBase64'],
            fileExtension: 'pdf',
            name: Date.now() + '.pdf',
            documentId: '1'
          });
          envDef.documents = [doc];

          const signer = docusign.Signer.constructFromObject({
            name: signerName,
            email: signerEmail,
            routingOrder: '1',
            recipientId: '1'
          });

          var signHere;
          if (request.hasOwnProperty('document_type') && global.config.documentTypes.hasOwnProperty(request.document_type))
            signHere = global.config.documentTypes[request.document_type]['signHereTabs'];
          else
            signHere = global.config.documentTypes['customerApplicationForm']['signHereTabs'];
          signer.tabs = docusign.Tabs.constructFromObject({
            signHereTabs: signHere
          });

          envDef.recipients = docusign.Recipients.constructFromObject({
            signers: [signer]
          });

          envDef.status = 'sent';
          let envelopesApi = new docusign.EnvelopesApi(),
            results;
          var eventNotification = {
            "url": global.config.docusignHookBaseUrl + '/' + global.config.version + '/docusign/webhook',
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
          results = await envelopesApi.createEnvelope(accountId, {
            'envelopeDefinition': envDef
          })
          let date = new Date().toISOString().slice(0, 19).replace('T', ' ');
          let paramsArray;
          paramsArray = new Array(
            request.activity_id,
            request.organization_id,
            results.envelopeId,
            signerEmail,
            signerName,
            envDef.emailSubject,
            envDef.emailBlurb,
            s3UploadUrl,
            '',
            date,
            results.status,
            '',
            request.asset_id,
            date,
            0,
            0
          )

          if (results) {
            results[0] = await db.callDBProcedure(request, 'ds_p1_activity_docusign_mapping_insert', paramsArray, 0);
            paramsArray = new Array(
              results[0][0]['activity_docusign_id'],
              2401,
              date
            )
            results[1] = await db.callDBProcedure(request, 'ds_p1_activity_docusign_mapping_history_insert', paramsArray, 0);
            var response = {
              'document_id': results[0][0]['activity_docusign_id']
            }
            return res.send(responseWrapper.getResponse(false, response, 200, request));
          }
        })
      })
    } catch (error) {
      return Promise.reject(error);
    }
  }

  this.query = async (request, res) => {
    var response = {}
    let results = []
    paramsArray =
      new Array(
        request.document_id
      )
    const queryString = util.getQueryString("ds_p1_activity_docusign_mapping_select", paramsArray, 1);
    if (queryString !== "") {
      await db
        .executeQueryPromise(1, queryString, request)
        .then(results => {
          var obj = {}
          var responseArray = []
          var receiverDetails = {}
          receiverDetails = {
            "docusign_receiver_name": results[0]['docusign_receiver_name'] || '',
            "docusign_receiver_email": results[0]['docusign_receiver_email' || '']
          }
          obj = {
            "activity_docusign_id": results[0]['activity_docusign_id'],
            "activity_id": results[0]['activity_id'],
            "docusign_unsigned_url": results[0]['docusign_unsigned_url'],
            "docusign_signed_url": results[0]['docusign_signed_url'],
            "document_type": results[0]['document_type'] || 'pdf',
            "receiver_details": [receiverDetails],
            "docusign_email_subject": results[0]['docusign_email_subject'],
            "docusign_sent_datetime": results[0]['docusign_sent_datetime'],
            "docusign_received_datetime": results[0]['docusign_received_datetime'],
            "uploaded_by": {
              "log_asset_id": results[0]['log_asset_id'],
            }
          }
          responseArray.push(obj)
          receiverDetails = {}
          obj = {}
          response = {
            "documents": responseArray
          }
        })
        .catch(err => {
          error = err;
        });
    }
    return res.send(responseWrapper.getResponse(false, response, 200, request));
  }

  this.updateStatus = async (request, res) => {
    var envelopeStatus = request.docusignenvelopeinformation.envelopestatus[0]
    var envelopeId = envelopeStatus.envelopeid[0]
    var status = envelopeStatus.status[0]
    var date = envelopeStatus.completed[0]
    var organization_id,
      account_id,
      workforce_id,
      activity_id,
      s3UploadUrl,
      activity_type_id,
      activity_type_category_id,
      articleType,
      title,
      asset_id,
      clientIPAddress,
      longitude,
      latitude,
      receiverName,
      receiverEmail,
      activity_docusign_id;
    await getAuditEventsDetails(async eventObj => {
      clientIPAddress = eventObj['clientIPAddress']
      longitude = eventObj['lg']
      latitude = eventObj['lt']
      if (status == 'Completed') {
        let paramsArray =
          new Array(
            envelopeId
          )
        const queryString = util.getQueryString("ds_p1_activity_docusign_mapping_select_envlope_id", paramsArray, 1);
        if (queryString !== "") {
          await db.executeQueryPromise(1, queryString, request)
            .then(results => {
              organization_id = results[0]['organization_id']
              account_id = results[0]['account_id']
              workforce_id = results[0]['workforce_id']
              activity_id = results[0]['activity_id']
              activity_type_id = results[0]['activity_type_id']
              activity_type_category_id = results[0]['activity_type_category_id']
              articleType = results[0]['activity_type_name']
              title = results[0]['docusign_email_subject']
              asset_id = results[0]['asset_id']
              receiverName = results[0]['docusign_receiver_name']
              receiverEmail = results[0]['docusign_receiver_email']
              activity_docusign_id = results[0]['activity_docusign_id']
            })
        }
        var base64 = ''
        var pdfContents = request.docusignenvelopeinformation.documentpdfs[0].documentpdf
        for (var i = 0; i < pdfContents.length; i++) {
          base64 = base64 + pdfContents[i].pdfbytes[0]
        }
        var stringBuffer = base64url.toBuffer(base64)
        var requestData = {
          'organization_id': organization_id,
          'account_id': account_id,
          'workforce_id': workforce_id,
          'asset_id': asset_id
        }
        s3UploadUrl = await uploadReadableStreamOnS3(requestData, stringBuffer, res)
        await updateWorkflowTimelineCorrespondingAccountId(
          organization_id,
          account_id,
          workforce_id,
          activity_id,
          s3UploadUrl,
          activity_type_id,
          activity_type_category_id,
          articleType,
          title,
          asset_id,
          receiverName,
          receiverEmail
        );
      }
      var results = []
      paramsArray =
        new Array(
          envelopeId,
          s3UploadUrl,
          date,
          status,
          date,
          clientIPAddress,
          latitude,
          longitude
        )
      results[0] = await db.callDBProcedure(request, 'ds_p1_activity_docusign_mapping_update', paramsArray, 0)
      paramsArray = new Array(
        activity_docusign_id,
        2402,
        date
      )
      results[1] = await db.callDBProcedure(request, 'ds_p1_activity_docusign_mapping_history_insert', paramsArray, 0);
      return (results[0])
    }, envelopeId)
  }

  function getAccessTokenUsingRefreshToken(callback) {
    const clientId = global.config.ClientId;
    const clientSecret = global.config.ClientSecret;
    const refreshToken = global.config.refreshToken;
    const clientString = clientId + ":" + clientSecret,
      postData = {
        "grant_type": "refresh_token",
        "refresh_token": refreshToken,
      },
      headers = {
        "Authorization": "Basic " + (new Buffer(clientString).toString('base64')),
      },
      authReq = superagent.post(global.config.refreshTokenUrl)
      .send(postData)
      .set(headers)
      .type("application/x-www-form-urlencoded");
    authReq.end(function (err, authRes) {
      if (err) {
        return callback(err, authRes);
      } else {
        const accessToken = authRes.body.access_token;
        return callback(accessToken)
      }
    })
  }

  function getAuditEventsDetails(callback, envelopeId) {
    var eventObj = {}
    getAccessTokenUsingRefreshToken(accessToken => {
      const headers = {
          "Authorization": "Bearer " + accessToken,
        },
        authReq = superagent.get(global.config.auditEventsUrl + global.config.accountId + "/envelopes/" + envelopeId + "/audit_events")
        .send().set(headers)
        .type("Beare Token");
      authReq.end(function (err, authRes) {
        if (err) {
          return callback(err, authRes);
        } else {
          var auditEvents = authRes.body.auditEvents
          for (var i = 0; i < auditEvents.length; i++) {
            for (var j = 0; j < auditEvents[i].eventFields.length; j++) {
              if (auditEvents[i].eventFields[j]['name'] == 'Action' && auditEvents[i].eventFields[j]['value'] == 'Signed') {
                for (var k = 0; k < auditEvents[i].eventFields.length; k++) {
                  if (auditEvents[i].eventFields[k]['name'] == 'ClientIPAddress')
                    eventObj['clientIPAddress'] = auditEvents[i].eventFields[k]['value']
                  if (auditEvents[i].eventFields[k]['name'] == 'GeoLocation') {
                    var geoLocation = auditEvents[i].eventFields[k]['value']
                    var location = geoLocation.split('=').join().split('&').join().split(',');
                    eventObj['lt'] = location[1] || 0
                    eventObj['lg'] = location[3] || 0
                  }
                }
              }
            }
          }
          return callback(eventObj)
        }
      })
    })
  }

  async function getHtmlToBase64(request, res) {
    try {
      var docusignWebApp = global.config.docusignWebApp
      var formDataUrl = docusignWebApp + '/#/forms/view/' + request.form_data
      const pdfObj = {}
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(formDataUrl, {
        waitUntil: "networkidle2",
        timeout: 0
      });
      await page.waitFor(20000);
      await page.setViewport({
        width: 1680,
        height: 1050
      });
      const pdf = await page.pdf();
      pdfObj['pdf'] = pdf
      await browser.close();
      const pdfBase64 = pdf.toString('base64');
      pdfObj['pdfBase64'] = pdfBase64
      return pdfObj
    } catch (err) {
      console.log(err)
      return res.send(responseWrapper.getResponse(err, {}, -9998, request));
    }
  }

  async function uploadReadableStreamOnS3(request, readableStream, res) {
    try {
      const bucketName = await util.getS3BucketName();
      const prefixPath = await util.getS3PrefixPath(request);
      const s3UploadUrlObj = await util.uploadReadableStreamToS3(request, {
        Bucket: bucketName,
        Key: `${prefixPath}/` + Date.now() + '.pdf',
        Body: readableStream,
        ContentType: 'application/pdf',
        ACL: 'public-read'
      }, readableStream);
      return s3UploadUrlObj.Location
    } catch (err) {
      console.log(err)
      return res.send(responseWrapper.getResponse(err, {}, -9998, request));
    }
  }

  async function updateWorkflowTimelineCorrespondingAccountId(
    org_id_val,
    account_id_val,
    workforce_id_val,
    activity_id_val,
    page_url_val,
    activity_type_id_val,
    activity_type_category_id_val,
    type,
    title,
    asset_id,
    receiverName,
    receiverEmail
  ) {
    var streamTypeId
    var subjectTxt = " Received signed document from " + receiverName + "(" + receiverEmail + ")"
    streamTypeId = 723
    var collectionObj = {
      content: page_url_val,
      subject: subjectTxt,
      mail_body: page_url_val,
      attachments: [],
      activity_reference: [{
        activity_title: "",
        activity_id: ""
      }],
      asset_reference: [{}],
      form_approval_field_reference: []
    };

    var currentDate = new Date();
    var currentDateInDateTimeFormat = getTimeInDateTimeFormat(currentDate);
    var epoch = moment().valueOf();

    var requestParams = {
      organization_id: org_id_val,
      account_id: account_id_val,
      workforce_id: workforce_id_val,
      activity_type_category_id: activity_type_category_id_val,
      activity_type_id: activity_type_id_val,
      activity_id: activity_id_val,
      activity_stream_type_id: streamTypeId,
      activity_timeline_collection: JSON.stringify(collectionObj),
      asset_id: asset_id,
      data_entity_inline: JSON.stringify(collectionObj),
      datetime_log: currentDateInDateTimeFormat,
      timeline_transaction_datetime: currentDateInDateTimeFormat,
      track_gps_datetime: currentDateInDateTimeFormat,
      device_os_id: 7,
      message_unique_id: epoch,
      timeline_stream_type_id: streamTypeId
    };
    var result = await activityTimelineService.addTimelineTransactionAsync(
      requestParams
    );
  }

  function getTimeInDateTimeFormat(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
  }
};


module.exports = commonDocusignService;
