/*
    author: bharat krishna masimukku
*/

let AnalyticsService = require("../services/analyticsService.js");

function AnalyticsController(objCollection) 
{
    let responseWrapper = objCollection.responseWrapper;
    let app = objCollection.app;
    //const util = objCollection.util;
    //const cacheWrapper = objCollection.cacheWrapper;
    //const queueWrapper = objCollection.queueWrapper;
    //const activityCommonService = objCollection.activityCommonService;

    const analyticsService = new AnalyticsService(objCollection);

    // Get the list of filter labels for the organization
    // Bharat Masimukku
    // 2019-07-11
    app.post
        (
            '/' + global.config.version + '/analytics/organization/filters/labels/list',
            async (req, res) => {
                try {
                    let result = await analyticsService.getFilterLabels(req.body);
                    res.send(responseWrapper.getResponse(false, result, 200, req.body));
                }
                catch (err) {
                    res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
                }
            }
        );

    // Add filter label for the organization
    app.post
        (
            '/' + global.config.version + '/analytics/organization/filters/labels/add',
            async (req, res) => {
                try {
                    let result = await analyticsService.addFilterLabel(req.body);
                    res.send(responseWrapper.getResponse(false, result, 200, req.body));
                }
                catch (err) {
                    res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
                }
            }
        );

    // Update filter label for the organization
    app.post
        (
            '/' + global.config.version + '/analytics/organization/filters/labels/update',
            async (req, res) => {
                try {
                    let result = await analyticsService.updateFilterLabel(req.body);
                    res.send(responseWrapper.getResponse(false, result, 200, req.body));
                }
                catch (err) {
                    res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
                }
            }
        );

    // Delete filter label for the organization
    app.post
        (
            '/' + global.config.version + '/analytics/organization/filters/labels/delete',
            async (req, res) => {
                try {
                    let result = await analyticsService.deleteFilterLabel(req.body);
                    res.send(responseWrapper.getResponse(false, result, 200, req.body));
                }
                catch (err) {
                    res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
                }
            }
        );

    //Get the list of filter values for the organization
    //Bharat Masimukku
    //2019-07-11
    app.post
    (
        '/' + global.config.version + '/analytics/organization/filters/values/list', 
        async (req, res) => 
        {        
            try 
            {
                let result = await analyticsService.getFilterValues(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Get the list of widgets and corresponding values
    //Bharat Masimukku
    //2019-07-16
    app.post
    (
        '/' + global.config.version + '/analytics/widget/list', 
        async (req, res) => 
        {        
            try 
            {
                let result = await analyticsService.getWidgetList(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Get specific widgets value
    //Bharat Masimukku
    //2019-07-16
    app.post
    (
        '/' + global.config.version + '/analytics/widget/value', 
        async (req, res) => 
        {        
            try 
            {
                let result = await analyticsService.getWidgetValue(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    //Get the drill down for a specific widget
    //Bharat Masimukku
    //2019-07-23
    app.post
    (
        '/' + global.config.version + '/analytics/widget/drilldown', 
        async (req, res) => 
        {        
            try 
            {
                let result = await analyticsService.getWidgetDrilldown(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err) 
            {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        }
    );

    app.post('/' + global.config.version + '/analytics/widget/add', async (req, res) => {        
        try {
            
            //try {
            //    JSON.parse(req.body.widget_inline_data);
            //} catch (exeption) {
            //    res.send(responseWrapper.getResponse(false, 'Invalid Inline JSON', -3308, req.body));
            //    return;
            //}

            let result = await analyticsService.analyticsWidgetAdd(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            //global.logger('conLog', 'Error : ', err, {});
            console.log('Error : ', err);
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
    });

    app.post('/' + global.config.version + '/analytics/widget/alter', async (req, res) => {        
        try {
            let result = await analyticsService.analyticsWidgetAlter(req.body);
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } catch(err) {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
    });

    //Get specific widgets value
    //Sravankumar
    //2020-07-01
    app.post('/' + global.config.version + '/analytics/management/widget/value', async (req, res) => {
            try{
                let result = await analyticsService.getManagementWidgetValue(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            }catch(err){
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
    });

    //Get the drill down for a specific widget
    //Sravankumar
    //2020-07-01
    app.post('/' + global.config.version + '/analytics/management/widget/drilldown', async (req, res) =>{             
            try{
                let result = await analyticsService.getManagementWidgetDrilldown(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            }catch(err){
                console.log('error :: ',err);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
    });

    //Get specific widgets value
    //Sravankumar
    //2020-07-01
    app.post('/' + global.config.version + '/analytics/management/widget/value/v1', async (req, res) => {
            try{
                let result = await analyticsService.getManagementWidgetValueV1(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            }catch(err){
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
    });

    //Get the drill down with limit for a specific widget
    //Sravankumar
    //2020-07-01
    app.post('/' + global.config.version + '/analytics/management/widget/drilldown/v1', async (req, res) =>{             
            try{
                let result = await analyticsService.getManagementWidgetDrilldownLimit(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            }catch(err){
                console.log('error :: ',err);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
    });  

    //Get the widget configuration mappings
    //Sravankumar
    //2020-08-27
    app.post('/' + global.config.version + '/analytics/management/widget/configs', async (req, res) =>{             
            try{
                let result = await analyticsService.getWidgetMappings(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            }catch(err){
                console.log('error :: ',err);
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
    });  

    //Get the list of management widgets
    //Sravankumar
    //2020-08-28
    app.post('/' + global.config.version + '/analytics/management/widget/list', async (req, res) => {        
            try{
                let result = await analyticsService.getManagementWidgetList(req.body);
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } 
            catch(err){
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
        });      
    
    app.post('/' + global.config.version + '/analytics/widget-type/add', async (req, res) => {        
            
                let [err,result] = await analyticsService.insertWidgetType(req.body);
                if(!err){
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
                } 
        });

    app.post('/' + global.config.version + '/analytics/widget-type/list', async (req, res) => {        
            
                let [err,result] = await analyticsService.selectWidgetType(req.body);
              if(!err){
                res.send(responseWrapper.getResponse(false, result, 200, req.body));
            } else {
                res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
                } 
        });

    app.post('/' + global.config.version + '/analytics/widget-type/delete', async (req, res) => {        
            
            let [err,result] = await analyticsService.deleteWidgetType(req.body);
          if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
    });
    
    app.post('/' + global.config.version + '/report/add', async (req, res) => {        
            
            let [err,result] = await analyticsService.addReport(req.body);
          if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
            } 
    });  

    app.post('/' + global.config.version + '/analytics/report/list', async (req, res) => {        

        let [err,result] = await analyticsService.retrieveReportList(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });

    app.post('/' + global.config.version + '/analytics/application/list', async (req, res) => {        

        let [err,result] = await analyticsService.getOrganizationApplications(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });    

    app.post('/' + global.config.version + '/analytics/asset/target/list', async (req, res) => {        

        let [err,result] = await analyticsService.getAssetTargetList(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });

    app.post('/' + global.config.version + '/analytics/drilldown/mapping/list', async (req, res) => {        
        let [err,result] = await analyticsService.getDrilldownMappingList(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });

    app.post('/' + global.config.version + '/analytics/widget/target/set', async (req, res) => {
        let [err,result] = await analyticsService.updateWidgetTargetValue(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });

    app.post('/' + global.config.version + '/analytics/asset/account/target/list', async (req, res) => {        

        let [err,result] = await analyticsService.getAssetAccountTargetList(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    app.post('/' + global.config.version + '/analytics/asset/account/target/list/v1', async (req, res) => {        

        let [err,result] = await analyticsService.getAssetAccountChannelTargetList(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    app.post('/' + global.config.version + '/analytics/widget_type/collection', async (req, res) => {        

        let [err,result] = await analyticsService.getwidgetStaticValueDetails(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    app.post('/' + global.config.version + '/analytics/report/transaction/list', async (req, res) => {        

        let [err,result] = await analyticsService.getReportTransactionList(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });    

    app.post('/' + global.config.version + '/analytics/widget/tag_type/filter/list', async (req, res) => {        

        let [err,result] = await analyticsService.getTagTypeFilters(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });    
        
    app.post('/' + global.config.version + '/analytics/report/access/list', async (req, res) => {        

        let [err,result] = await analyticsService.getAssetReportMapping(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  
    
    app.post('/' + global.config.version + '/analytics/report/access/list/v1', async (req, res) => {        

        let [err,result] = await analyticsService.getAssetReportMappingV1(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    }); 

    
    app.post('/' + global.config.version + '/analytics/widget/reportee/target/list', async (req, res) => {        

        let [err,result] = await analyticsService.getAssetReporteeTargetValues(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    }); 

    
    app.post('/' + global.config.version + '/asset/last_hierarchy/set', async (req, res) => {        

        let [err,result] = await analyticsService.assetListUpdateLastHierarchy(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    app.post('/' + global.config.version + '/analytics/asset/access/leevl/mapping', async (req, res) => {        

        let [err,result] = await analyticsService.getAssetAccessLevelMapping(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    
    app.post('/' + global.config.version + '/report/filter/set', async (req, res) => {        

        let [err,result] = await analyticsService.reportFilterListInsert(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    
    app.post('/' + global.config.version + '/report/filter/list', async (req, res) => {        

        let [err,result] = await analyticsService.getReportFilterListSelect(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    
    app.post('/' + global.config.version + '/report/filter/delete', async (req, res) => {        

        let [err,result] = await analyticsService.reportFilterListDelete(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });

    
    app.post('/' + global.config.version + '/retrieve/filter/data', async (req, res) => {        

        let [err,result] = await analyticsService.getTagListSelectDashobardFilters(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    
    app.post('/' + global.config.version + '/dashboard/access/set', async (req, res) => {        

        let [err,result] = await analyticsService.assetAccessLevelMapping(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    
    app.post('/' + global.config.version + '/report/access/set', async (req, res) => {        

        let [err,result] = await analyticsService.assetReportMapping(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    
    app.post('/' + global.config.version + '/analytics/asset/report/mapping', async (req, res) => {        

        let [err,result] = await analyticsService.getAssetReportMappingSelectAsset(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    
    app.post('/' + global.config.version + '/dashboard/access/reset', async (req, res) => {        

        let [err,result] = await analyticsService.assetAccessLevelMappingDelete(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    
    app.post('/' + global.config.version + '/report/access/reset', async (req, res) => {        

        let [err,result] = await analyticsService.assetReportMappingDelete(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    
    app.post('/' + global.config.version + '/asset/leave/list', async (req, res) => {        

        let [err,result] = await analyticsService.getAssetLeaveMappingSelect(req.body);
        if(!err){
            res.send(responseWrapper.getResponse(false, result, 200, req.body));
        } else {
            res.send(responseWrapper.getResponse(err, {}, -9998, req.body));
        } 
    });  

    
    }

module.exports = AnalyticsController;
