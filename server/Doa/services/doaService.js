
function doaService(objectCollection) {

    const util = objectCollection.util;
    const db = objectCollection.db;
    const activityCommonService = objectCollection.activityCommonService;    
    const makeRequest = require('request');
    const nodeUtil = require('util');
    const self = this;

    //function sleep(ms) {
    //    return new Promise(resolve => setTimeout(resolve, ms));
    //}

    /*this.getAssetAccessDetails = async function (request) {
        let assetData = [],
            error = true
            responseData = [];

        const paramsArr = new Array(
            request.organization_id,
            request.target_account_id,
            request.target_workforce_id,
            request.desk_asset_id || 0,
            request.manager_asset_id || request.asset_id,
            request.page_start,
            request.page_limit
        );
        const queryString = util.getQueryString('ds_v1_asset_access_mapping_select_asset_access_all', paramsArr);
        if (queryString !== '') {

            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {
                    responseData.push(data);
                    error = false;
                    assetData = await self.getAssetUnderAManagerInaWorforce(request);
                    responseData.push(assetData);

                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];
    };*/


this.getProductSelection = async(request) => {

    let formInlineData = JSON.parse(request.activity_inline_data);
    for(const fieldData  of formInlineData) {
        if(Number(fieldData.field_data_type_id) === 57) { // Or 33 //workflow reference 57 - single selection
            
        //Step: 1 - Identify the product selection of the opportunity
        let [err, productData] = activityCommonService.activityActivityMappingSelect({
                                        activity_id: request.activity_id, 
                                        parent_activity_id: request.parent_activity_id, 
                                        organization_id: request.organization_id
                                    });

        console.log('Product Data : ', productData);

        }
    }

    //Step 2 - Identify the product tag based on the Product Selection
        //Need to ask DB Sai

    //Step 3 - Identify the DoA hierarchy logic
        /*1) Mobility
          2) FLV
          3) IOT 
          4) FLD
          5) Cloud_VSDM
          6) ISD */

    //Step 4 - 

    }; 

    this.mobilityDoa = async(request) => {
      //Step 1: Based on the config data of form/field Ids for the parameters, 
      // retrive the values of the parameters from the form submission which triggerred the DoA logic.
      
      //Step 2: Analyse the values and identify the lowest and highest authorities
        //If any of the required params are null simply return
        //ebitda - f1
        //deployment/REvenue circle - f2
        //Monthly Rental - f3
        //Connection Type - f4

        let ebitda, 
            deployment_evenue,
            monthly_rental,
            connection_type;

        //Add Appropriate Desk to the Opportunity Workflow
        if(field_2 == 'Single' && field_4 == 'COCP') {
            //Irrespective of percentage
            //It starts from Circle L1

        } else if(field_2 == 'Multi' && field_3 <= 199 && field_4 == 'COCP/IOIP') {
            //Irrespective of percentage
            // It starts from CC L1 & CF L1
        }

    };

    async function getAppropriateDesk(request) {
        //Get the appropriate desk for the respective opportunity
        //Circle L1, L2, L3
        //Corporate Commercial L1, L2
        //Corporate Finance L1, L2, L3
        //CLT L1, L2, L3

        let error = true,
        responseData = [];

        const paramsArr = new Array(
            request.organization_id,
            request.tag_type_category_id,
            request.tag_type_id,            
            request.start_from || 0,
            request.page_limit || 5
        );
        const queryString = util.getQueryString('ds_p1_tag_entity_mapping_select_tag_type', paramsArr);
        if (queryString !== '') {
            await db.executeQueryPromise(1, queryString, request)
                .then(async (data) => {
                    responseData.push(data);
                    error = false;
                })
                .catch((err) => {
                    error = err;
                });
        }
        return [error, responseData];

    }

    async function addAppropriateDesk() { //Add circle desk to the workflow
        //Circle L1, L2, L3
        //Corporate Commercial L1, L2
        //Corporate Finance L1, L2, L3
        //CLT L1, L2, L3

    }

    //Lead can either Approve or Reject
    this.opportunityApproved = async(request)=>{
        //Fetch the next level desk depending on the current lead
        
        //Add the desk to the opportunity Workflow
    };

}

module.exports = doaService;