function DiffbotService(objectCollection) {
  const request = require("request");
  const moment = require("moment");
  const db = objectCollection.db;
  var ActivityTimelineService = require("../../services/activityTimelineService.js");
  const activityTimelineService = new ActivityTimelineService(objectCollection);
  const util = objectCollection.util;
  var accountsList = [];
  var articleType = 'article';
  var tenderType = 'tender';
  var start_from = 0;
  var limit_value = 500;
  var currentNumberOfAccounts;
  var AsyncLock = require('async-lock');
  var lock = new AsyncLock();
  hasMoreData = true;
  var elasticsearch = require('elasticsearch');
  var client = new elasticsearch.Client({
     hosts: [  global.config.elastiSearchNode]
  });

  this.queryDiffbot = async diffbotrequest => {
    try {
        let channel = Channel(accountsList);
        for(var i=0;i<global.config.numberOfThreadsForDiffbotProcessing;i++)
        {
         Worker()(channel);
        }        
      return "succesfull";
    } catch (error) {
      return Promise.reject(error);
    }
  };

  async function processAccountsDiffbot(start_from,limit_value,diffbotrequest) {
    let accountsListTmp = await getAccountsListFromEs("",start_from,limit_value);
    //  accountsListTmp = await getAccountsList(
    //   diffbotrequest,
    //   "",
    //   start_from,
    //   limit_value 
    // );
    accountsList.push(...accountsListTmp);
    currentNumberOfAccounts = accountsList.length;
  }

  function getKnowledgeGraphUrl() {
    return global.config.knowledgeGraphUrl;
  }

  function getKnowledgeGraphTypeParams() {
    return ":Article";
  }

  function getknowledgeGraphPublishedCountry()
  {
    return 'publisherCountry:"India" ';
  }

  function getKnowledgeTypeDateParams() {
    var currentDate = new Date();
    var yesterday = currentDate.setDate(currentDate.getDate() - 1);
    // var dateParam = "date.timestamp>=1586931240000 ";
    var dateParam = "date.timestamp>=" + yesterday + " ";
    return dateParam;
  }

   async function processDiffbotRequest(account)
  {
    var knowlegdeGraphUrl = getKnowledgeGraphUrl();
    var KnowledgeGraphTypeParams = getKnowledgeGraphTypeParams();
    var knowledgeGraphPublishedCountry = getknowledgeGraphPublishedCountry()
    var knowlegeGrapDateParams = getKnowledgeTypeDateParams();
    var knowlegeGraphKeywordsOrParams = getknowledgeGraphOrParams();
    var diffbotrequest = {};
    let results = new Array();
    let paramsArray;
    var encodedKnowledgeGraphParams = getEncodedKnowledgeGraphParams(
      account["activity_title"],
      knowlegeGraphKeywordsOrParams,
      KnowledgeGraphTypeParams,
      knowlegeGrapDateParams,
      knowledgeGraphPublishedCountry
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
              account.activity_id,
              parsedResponse.data[k].id,
              diffbotrequest
            );
            if (checkResult.length == 0) {
              var result = await insertPageUrlCorrespondingAccountId(
                account.activity_id,
                parsedResponse.data[k].id,
                parsedResponse.data[k].pageUrl,
                diffbotrequest
              );
              await updateWorkflowTimelineCorrespondingAccountId(
                account.organization_id,
                account.account_id,
                account.workforce_id,
                account.activity_id,
                parsedResponse.data[k].pageUrl,
                account.activity_type_id,
                account.activity_type_category_id,
                articleType,
                parsedResponse.data[k].title

              );
            }
          }
        }
      }
    }

  }

  const Worker = () => (channel) => {
    const next = async () => {
      const account =  await channel.getWork();
      if (!account) {
        return;
      }
     await processDiffbotRequest(account)
      next();

    };
    next();
  };

  const Channel = (queue) => {
    return { getWork:  async() => {
      if(queue.length == 0 )
      {
        var lockResult =await lock.acquire('key',   async function() {
         if(queue.length == 0 && hasMoreData)
         {
            await processAccountsDiffbot(start_from,limit_value,{})
            start_from = start_from + limit_value
            if(queue.length<limit_value)
            {
              hasMoreData = false
            }
         }
     },{}).then(function(){
       return queue.pop();
      });
     return lockResult;
      }
      else
      {
        return queue.pop();
      }
    }};
  };

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


  function getEncodedKnowledgeGraphParams(account_name,
    knowlegeGraphKeywordsOrParams,
    KnowledgeGraphTypeParams,
    knowlegeGrapDateParams,
    knowledgeGraphPublishedCountry) {

      var encodededKnowledgeGraphTypeParams = encodeURIComponent(KnowledgeGraphTypeParams)
      var encodedKnowledgeGraphPublishedCountry = encodeURIComponent(knowledgeGraphPublishedCountry)
      var encodedKnowledgeGraphDateParams = encodeURIComponent(knowlegeGrapDateParams)
      var accountText= "text:'" +account_name +"' "
      var encodedAccountName = encodeURIComponent(accountText)
      var encodedKnowledgeGraphOrParams = encodeURIComponent(knowlegeGraphKeywordsOrParams)
      var encodedKnowledgeGraphParams =  encodededKnowledgeGraphTypeParams + "+"+encodedKnowledgeGraphPublishedCountry+encodedKnowledgeGraphDateParams+encodedAccountName+encodedKnowledgeGraphOrParams
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
    const queryString = util.getQueryString(
      "ds_p1_activity_article_transaction_select",
      paramsArrayForCheckResult,
      1
    );
    if (queryString !== "") {
      await db
        .executeQueryPromise(1, queryString, request)
        .then(data => {
          responseData = data;
          error = false;
        })
        .catch(err => {
          error = err;
        });
    }
    return responseData;
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

  async function getAccountsList(request,searchStr,start_from,limit_value) {
    let result;
    let paramsArray;
    paramsArray = new Array(searchStr,start_from,limit_value);
    const queryString = util.getQueryString(
      "ds_p1_1_activity_list_select_web_crawling",
      paramsArray,
      1
    );
    if (queryString !== "") {
      await db
        .executeQueryPromise(1, queryString, request)
        .then(data => {
          responseData = data;
          error = false;
        })
        .catch(err => {
          error = err;
        });
    }
    return responseData;
  }

  async function getAccountsListFromEs(searchStr,start_from,limit_value) {
    try {
      var responseData = [];
      if(searchStr == '0'){
        return responseData;
      }else{
        var pagination = {};
            pagination['size'] = limit_value;
            pagination['from'] = start_from;

        var query = {};
        if(searchStr != ""){
          query = {
            "query": {
              "bool": {
                "must": [{
                  "bool": {
                    "should": {
                      "multi_match": {
                        "query": searchStr,
                        "type": "cross_fields",
                        "fields": ["activity_title"],
                        "operator": "and"
                      }
                    }
                  }
                }]
              }
            }
          };
        }
        query = Object.assign(query, pagination);
        console.log('QUERY : ', query);
        
        responseData = await client.search({
          index: global.config.elasticCrawlingAccountTable,
          body: query
        });
        
        return responseData.hits['hits'];
      }
    } catch (err) {
      console.log(err);
      return Promise.reject(err);
    }
  }

  async function getAccountsListForTenderCrawling(request,searchStr,start_from,limit_value) {
    let result;
    let paramsArray;
    paramsArray = new Array(searchStr,start_from,limit_value);
    const queryString = util.getQueryString(
      "ds_p1_1_activity_list_select_tender_crawling",
      paramsArray,
      1
    );
    if (queryString !== "") {
      await db
        .executeQueryPromise(1, queryString, request)
        .then(data => {
          responseData = data;
          error = false;
        })
        .catch(err => {
          error = err;
        });
    }
    return responseData;
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
    title
  ) {

    var subjectTxt
    var streamTypeId
    if(type == articleType)
    {
      subjectTxt=" A new article with title ' "+title+" ' has been identified for your account.";
      streamTypeId = 723; 
    }else
    {
      subjectTxt="A new tender with tender ID ' "+title+" ' has been identified for your account. ";
      streamTypeId = 724; 

    }
    var collectionObj = {
      content:page_url_val,
      subject: subjectTxt,
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
      activity_stream_type_id: streamTypeId,
      activity_timeline_collection: JSON.stringify(collectionObj),
      asset_id: 100,
      data_entity_inline: JSON.stringify(collectionObj),
      datetime_log: currentDateInDateTimeFormat,
      timeline_transaction_datetime: currentDateInDateTimeFormat,
      track_gps_datetime: currentDateInDateTimeFormat,
      device_os_id: 7,
      message_unique_id: epoch,
      timeline_stream_type_id: streamTypeId
    };

    var result = await activityTimelineService.addTimelineTransactionAsync(requestParams);
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
        BifarcationSearch: "",
        W_Location: "",
        SubIndustryName: ""
      };
      var tenderTigerApiUrl =
        "https://www.tendertiger.com/Contentnd/WebMethod/AdvanceTenderSearchWebMethod.aspx/GetAdvaceSearchData";

      //let cnt = 0;
      for (var i = 0; i < global.config.knowledgeGraphKeywords.length; i++) {            
        body["Searchtex"] = global.config.knowledgeGraphKeywords[i];
        var tenders = [];
        console.log(' ');
        //cnt = 0;
        while (true) {          
          //if(cnt === 5){
          //  break;
          //}
          //cnt++;
          var tenderList = await getTenderList(
            headers,
            body,
            tenderTigerApiUrl
          );          
          if (tenderList.length > 0) {
            console.log('Received Tenders for -  ', global.config.knowledgeGraphKeywords[i]);

            if (body["startIndex"] == 0) {
              tenders = [];
            }
            for (var i_iterator = 0; i_iterator < tenderList.length; i_iterator++) {
              tenders.push(tenderList[i_iterator]);
            }
            body["startIndex"] = body["startIndex"] + 10;
          } else {
            body["startIndex"] = 0;
            console.log('Did not receive any tenders!');
            break;
          }
        }
          
        for (var k = 0; k < tenders.length; k++) {
            tenders[k]["CompanyName"]= processTenderCompanyName(tenders[k]["CompanyName"]);
            console.log('Getting Accounts from ES for company: ', tenders[k]["CompanyName"]);
            accountsList = await getAccountsListFromEs(tenders[k]["CompanyName"] || '0',0,50);
             
            console.log('accountsList : ', accountsList);

            //  accountsList = await getAccountsListForTenderCrawling(diffbotrequest,tenders[k]["CompanyName"] || 0,0,50);
            for( var j=0;j<accountsList.length;j++) {
              if (accountsList[j]['_source']["activity_title"] == tenders[k]["CompanyName"]) {
                var checkResult = await checkIfAccountIDTenderIdExist(
                  accountsList[j]['_source'].activity_id,
                  tenders[k].tid,
                  diffbotrequest
                );
                if (checkResult.length == 0) {
                  var result = await insertTenderCorrespondingAccountId(
                    tenders[k].tid,
                    accountsList[j]['_source'].activity_id,
                    tenderTigerUrl,
                    tenderTigerUrl + tenders[k].detailurl,
                    tenders[k].closingdate,
                    diffbotrequest
                  );
                  await updateWorkflowTimelineCorrespondingAccountId(
                    868,
                    accountsList[j]['_source'].account_id,
                    accountsList[j]['_source'].workforce_id,
                    accountsList[j]['_source'].activity_id,
                    tenderTigerUrl + tenders[k].detailurl,
                    accountsList[j]['_source'].activity_type_id,
                    53,
                    tenderType,
                    tenders[k].tid
                  );
                }
              } else {
                console.log('Activity Title - ', accountsList[j]['_source']["activity_title"]);
                console.log('Company Name - ', tenders[k]["CompanyName"]);                

                let temp = {
                  es_activity_title: accountsList[j]['_source']["activity_title"],
                  crawled_comapany_name: tenders[k]["CompanyName"]
                };

                temp = JSON.stringify(temp);
                tenderCrawlTxnInsert({ inline_data: temp });
              }
             }           
          }        
      }
      return "successful";
    } catch (error) {
      return Promise.reject(error);
    }
  };

  function processTenderCompanyName(CompanyName)
  {
     var aplhaNumericCompanyName;
     aplhaNumericCompanyName = CompanyName.replace(/\W/g, '');
     if(aplhaNumericCompanyName.includes('Ltd'))
     {
      aplhaNumericCompanyName = aplhaNumericCompanyName.replace(/Ltd/gi, "limited");
     }
     if(aplhaNumericCompanyName.includes('Pvt'))
     {
      aplhaNumericCompanyName = aplhaNumericCompanyName.replace(/Pvt/gi, "private");
     }
     aplhaNumericCompanyName = aplhaNumericCompanyName.toLowerCase();
     return aplhaNumericCompanyName;
  }

  async function getTenderList(headers, body, tenderTigerApiUrl) {    
    let res;
    try{
      res = await doTenderApiCall(headers, body, tenderTigerApiUrl);
      var parsedResponse = JSON.parse(res);
      var tenderList = [];
      var tenderObj = JSON.parse(parsedResponse["d"]);
      tenderList = tenderObj[0]["lstTenders"];
      return tenderList;
    } catch(err) {
      console.log('Error : ', err);
      return [];
    }
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
    const queryString = util.getQueryString(
      "ds_p1_activity_tender_mapping_select",
      paramsArrayForCheckResult,
      1
    );
    if (queryString !== "") {
      await db
        .executeQueryPromise(1, queryString, request)
        .then(data => {
          responseData = data;
          error = false;
        })
        .catch(err => {
          error = err;
        });
    }
    return responseData;
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
    var currentDate = new Date();
    var currentDateInDateTimeFormat = getTimeInDateTimeFormat(currentDate);
    paramsArray = new Array(
      account_id,
      tender_id,
      tender_from_url,
      tender_info_url,
      dateTimeFormatExpiryDate,
      currentDateInDateTimeFormat
    );
    result = await db.callDBProcedure(
      request,
      "ds_p1_activity_tender_mapping_insert",
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

  async function tenderCrawlTxnInsert(request) {
        let responseData = [],
            error = true;

        let paramsArr = new Array(
            request.inline_data || '{}',
            util.getCurrentUTCTime()
        );

        const queryString = util.getQueryString('ds_p1_tender_crawl_data_transaction_insert', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then((data) => {
                  responseData = data;
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }

        return [error, responseData];
  }

}
module.exports = DiffbotService;
