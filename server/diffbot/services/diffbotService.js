function DiffbotService(objectCollection) {
  const request = require("request");
  const moment = require("moment");
  const db = objectCollection.db;
  var ActivityTimelineService = require("../../services/activityTimelineService.js");
  const activityTimelineService = new ActivityTimelineService(objectCollection);

  this.queryDiffbot = async diffbotrequest => {
    try {
      var knowlegdeGraphUrl = getKnowledgeGraphUrl();
      var KnowledgeGraphTypeParams = getKnowledgeGraphTypeParams();
      var knowlegeGrapDateParams = getKnowledgeTypeDateParams();
      var knowlegeGraphKeywordsOrParams = getknowledgeGraphOrParams();
      var accountsList = await getAccountsList();
      for (var j = 0; j < accountsList.length; j++) {
        let results = new Array();
        let paramsArray;
        var knowledgeGraphAllParams = getKnowledgeGraphAllParams(
          accountsList[j]["activity_title"],
          knowlegeGraphKeywordsOrParams,
          KnowledgeGraphTypeParams,
          knowlegeGrapDateParams
        );
        var encodedKnowledgeGraphParams = getEncodedKnowledgeGraphParams(
          knowledgeGraphAllParams
        );
        var knowledgeGraphApiUrl =
          knowlegdeGraphUrl + encodedKnowledgeGraphParams;
        let res = await doDiffBotRequest(knowledgeGraphApiUrl);
        var parsedResponse = JSON.parse(res);
        if (typeof parsedResponse != "undefined") {
          if ("data" in parsedResponse) {
            if (parsedResponse.data.length > 0) {
              for (var k = 0; k < parsedResponse.data.length; k++) {
                var checkResult = await checkIfAccountIDArticleIdExist(
                  accountsList[j].activity_id,
                  parsedResponse.data[k].id,
                  diffbotrequest
                );
                if (checkResult[0]["COUNT(*)"] == 0) {
                  var result = await insertPageUrlCorrespondingAccountId(
                    accountsList[j].activity_id,
                    parsedResponse.data[k].id,
                    parsedResponse.data[k].pageUrl,
                    diffbotrequest
                  );
                  await updateWorkflowTimelineCorrespondingAccountId(
                    accountsList[j].organization_id,
                    accountsList[j].account_id,
                    accountsList[j].workforce_id,
                    accountsList[j].activity_id,
                    parsedResponse.data[k].pageUrl,
                    accountsList[j].activity_type_id,
                    accountsList[j].activity_type_category_id
                  );
                }
              }
            }
          }
        }
      }
      return "succesfull";
    } catch (error) {
      return Promise.reject(error);
    }
  };

  function getKnowledgeGraphUrl() {
    return global.config.knowledgeGraphUrl;
  }

  function getKnowledgeGraphTypeParams() {
    return ":Article ";
  }

  function getKnowledgeTypeDateParams() {
    var currentDate = new Date();
    var yesterday = currentDate.setDate(currentDate.getDate() - 1);
    var dateParam = "date.timestamp>=" + yesterday + " ";
    return dateParam;
  }

  function getknowledgeGraphOrParams() {
    var knowlegeGraphKeywordsOrParams = "text:or(";
    for (var i = 0; i < global.config.knowledgeGraphKeywords.length; i++) {
      if (i != global.config.knowledgeGraphKeywords.length - 1) {
        knowlegeGraphKeywordsOrParams =
          knowlegeGraphKeywordsOrParams +
          '"' +
          global.config.knowledgeGraphKeywords[i] +
          '",';
      } else {
        knowlegeGraphKeywordsOrParams =
          knowlegeGraphKeywordsOrParams +
          '"' +
          global.config.knowledgeGraphKeywords[i] +
          '"';
      }
    }
    knowlegeGraphKeywordsOrParams = knowlegeGraphKeywordsOrParams + ")";
    return knowlegeGraphKeywordsOrParams;
  }

  function getKnowledgeGraphAllParams(
    account_name,
    knowlegeGraphKeywordsOrParams,
    KnowledgeGraphTypeParams,
    knowlegeGrapDateParams
  ) {
    var knowledgeGraphAllParams =
      KnowledgeGraphTypeParams +
      knowlegeGrapDateParams +
      "text:'" +
      account_name +
      "' " +
      knowlegeGraphKeywordsOrParams;
    console.log(knowledgeGraphAllParams);
    return knowledgeGraphAllParams;
  }

  function getEncodedKnowledgeGraphParams(knowledgeGraphAllParams) {
    var encodedKnowledgeGraphParams = encodeURIComponent(
      knowledgeGraphAllParams
    );
    return encodedKnowledgeGraphParams;
  }

  async function checkIfAccountIDArticleIdExist(
    account_id,
    article_id,
    request
  ) {
    let paramsArrayForCheckResult;
    let checkResult;
    paramsArrayForCheckResult = new Array(account_id, article_id);
    checkResult = await db.callDBProcedure(
      request,
      "ds_p1_check_accountid_pageurl_exist",
      paramsArrayForCheckResult,
      1
    );
    return checkResult;
  }

  async function insertPageUrlCorrespondingAccountId(
    account_id,
    article_id,
    page_url,
    request
  ) {
    let result;
    let paramsArray;
    let currentDate = new Date();
    dateTimeFormatCurrentDate = getTimeInDateTimeFormat(currentDate);
    paramsArray = new Array(
      account_id,
      article_id,
      page_url,
      dateTimeFormatCurrentDate
    );
    result = await db.callDBProcedure(
      request,
      "ds_p1_activity_article_transaction_insert",
      paramsArray,
      0
    );
    return result;
  }

  async function getAccountsList(request) {
    let result;
    let paramsArray;
    paramsArray = new Array(868, 0, 0, 0, 0, "", 1, 0, 0, 9000);
    result = await db.callDBProcedure(
      request,
      "ds_p1_activity_list_search_workflow_reference",
      paramsArray,
      1
    );
    return result;
  }

  async function updateWorkflowTimelineCorrespondingAccountId(
    org_id_val,
    account_id_val,
    workforce_id_val,
    activity_id_val,
    page_url_val,
    activity_type_id_val,
    activity_type_category_id_val
  ) {
    var collectionObj = {
      content:
        "A new article has been identified for your account. Please refer to this <u>" +
        page_url_val +
        "</u> for the article.",
      subject: page_url_val,
      mail_body: page_url_val,
      attachments: [],
      activity_reference: [{ activity_title: "", activity_id: "" }],
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
      activity_stream_type_id: 723,
      activity_timeline_collection: JSON.stringify(collectionObj),
      asset_id: 100,
      data_entity_inline: JSON.stringify(collectionObj),
      datetime_log: currentDateInDateTimeFormat,
      timeline_transaction_datetime: currentDateInDateTimeFormat,
      track_gps_datetime: currentDateInDateTimeFormat,
      device_os_id: 7,
      message_unique_id: epoch,
      timeline_stream_type_id: 723
    };

    var result = await activityTimelineService.addTimelineTransactionAsync(
      requestParams
    );
  }

  function doDiffBotRequest(knowledgeGraphApiUrl) {
    return new Promise(function(resolve, reject) {
      request(
        {
          url: knowledgeGraphApiUrl,
          method: "GET",
          headers: {
            "Content-Type": " application/json"
          }
        },
        function(error, response, body) {
          if (error) {
            reject(error);
          } else {
            resolve(body);
          }
        }
      );
    });
  }

  function getTimeInDateTimeFormat(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
  }

  this.getTendersFromTenderTigerWebsite = async diffbotrequest => {
    try {
      var tenderTigerUrl = "https://www.tendertiger.com";
      var headers = {
        "Content-Type": "application/json"
      };
      var body = {
        tabindex: "1",
        startIndex: 0,
        PageSize: "10",
        CompanyName: "",
        TenderNo: "",
        Tendervaluefrom: "",
        Tendervalueto: "",
        ClosingDate: "",
        PublishDate: getYesterdaysDate() + " - " + getTodaysDate(),
        Location: "",
        W_TID: "",
        W_DueDate: "",
        W_PublishDate: "",
        W_Organizationname: "",
        W_Industry: "",
        W_WordSearch: "",
        TenderValue_Condition: "",
        BifarcationSearch: ""
      };
      tenderTigerApiUrl =
        "https://www.tendertiger.com/Contentnd/WebMethod/AdvanceTenderSearchWebMethod.aspx/GetAdvaceSearchData";
      var accountsList = await getAccountsList();

      for (var i = 0; i < global.config.knowledgeGraphKeywords.length; i++) {
        body["Searchtex"] = global.config.knowledgeGraphKeywords[i];
        var tenders = [];
        while (true) {
          var tenderList = await getTenderList(
            headers,
            body,
            tenderTigerApiUrl
          );
          if (tenderList.length > 0) {
            if (body["startIndex"] == 0) {
              tenders = [];
            }
            for (var i = 0; i < tenderList.length; i++) {
              tenders.push(tenderList[i]);
            }
            body["startIndex"] = body["startIndex"] + 10;
          } else {
            body["startIndex"] = 0;
            break;
          }
        }
        for (var j = 0; j < accountsList.length; j++) {
          for (var k = 0; k < tenders.length; k++) {
            if (
              accountsList[j]["activity_title"] == tenders[k]["CompanyName"]
            ) {
              var checkResult = await checkIfAccountIDTenderIdExist(
                accountsList[j].activity_id,
                tenders[k].tid,
                diffbotrequest
              );
              if (checkResult[0]["COUNT(*)"] == 0) {
                var result = await insertTenderCorrespondingAccountId(
                  tenders[k].tid,
                  accountsList[j].activity_id,
                  tenderTigerUrl,
                  tenderTigerUrl + tenders[k].detailurl,
                  tenders[k].closingdate,
                  diffbotrequest
                );
              }
            }
          }
        }
      }
      return "succesfull";
    } catch (error) {
      return Promise.reject(error);
    }
  };

  async function getTenderList(headers, body, tenderTigerApiUrl) {
    let res = await doTenderApiCall(headers, body, tenderTigerApiUrl);
    var parsedResponse = JSON.parse(res);
    var tenderList = [];
    var tenderObj = JSON.parse(parsedResponse["d"]);
    tenderList = tenderObj[0]["lstTenders"];
    return tenderList;
  }

  function doTenderApiCall(headers_val, payload, apiurl) {
    return new Promise(function(resolve, reject) {
      request(
        {
          url: apiurl,
          method: "POST",
          headers: headers_val,
          body: JSON.stringify(payload)
        },
        function(error, response, body) {
          if (error) {
            reject(error);
          } else {
            resolve(body);
          }
        }
      );
    });
  }

  async function checkIfAccountIDTenderIdExist(account_id, tender_id, request) {
    let paramsArrayForCheckResult;
    let checkResult;
    paramsArrayForCheckResult = new Array(account_id, tender_id);
    checkResult = await db.callDBProcedure(
      request,
      "ds_p1_check_accountid_tenderid_exist",
      paramsArrayForCheckResult,
      1
    );
    return checkResult;
  }

  async function insertTenderCorrespondingAccountId(
    tender_id,
    account_id,
    tender_from_url,
    tender_info_url,
    closing_date,
    request
  ) {
    let result;
    let paramsArray;
    let expiry_date = new Date(closing_date);
    let dateTimeFormatExpiryDate = getTimeInDateTimeFormat(expiry_date);
    paramsArray = new Array(
      tender_id,
      account_id,
      tender_from_url,
      tender_info_url,
      dateTimeFormatExpiryDate
    );
    result = await db.callDBProcedure(
      request,
      "ds_p1_account_tender_info_insert",
      paramsArray,
      0
    );
    return result;
  }

  function getYesterdaysDate() {
    var date = new Date();
    date.setDate(date.getDate() - 1);
    return moment(new Date(date)).format("DD-MM-YYYY");
  }

  function getTodaysDate() {
    return moment(new Date()).format("DD-MM-YYYY");
  }

}
module.exports = DiffbotService;
