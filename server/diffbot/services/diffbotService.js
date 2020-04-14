function DiffbotService(objectCollection) {
  const request = require("request");
  const db = objectCollection.db;

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
    var dateParam = "date.timestamp>="+yesterday+" "
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
    dateTimeFormatCurrentDate =
      currentDate.getFullYear() +
      "-" +
      (currentDate.getMonth() + 1) +
      "-" +
      currentDate.getDate() +
      " " +
      currentDate.getHours() +
      ":" +
      currentDate.getMinutes() +
      ":" +
      currentDate.getSeconds();
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
}

module.exports = DiffbotService;
