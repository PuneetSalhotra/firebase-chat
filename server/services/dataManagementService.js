const puppeteer = require('puppeteer');
const ActivityTimelineService = require("./activityTimelineService.js");
const request = require('request');
const moment = require("moment");

module.exports = function DataManagementService(params) {
    const util = params.util;
    const responseWrapper = params.responseWrapper;
    const activityTimelineService = new ActivityTimelineService(params);

    /**
     *  @exportFormsDataToPdf
        -- request should must have below metion params
            organization_id,
            account_id,
            workforce_id,
            asset_id,
            activity_type_category_id,
            activity_type_id,
            activity_id,
            form_data - is going to use to generate the pdf for provided forms.
    */

    this.exportFormsDataToPdf = async (req,res) => {
        try {
            console.log('==== starting data management export ====');
            const pdfResult = await generateFormDataPdf(req,res);// generate pdf    
            console.log("pdf generated");
            const pdfUrl = await pushStreamToS3(req,pdfResult,res)// upload pdf to s3 
            console.log("pdf to s3",pdfUrl);
            await putTimelineEntry(req,res,pdfUrl); // add timeline entry 
            console.log("add timeline entyr");
            return res.send(responseWrapper.getResponse(
                false,
                {pdfUrl},
                200,
                request
            ))
        } catch(err) {
            console.log(err)
            return res.send(responseWrapper.getResponse(err,{},-9998,req));
        }

    }

    async function generateFormDataPdf(req,res) {
        try {
            const exportFormUrl = `${global.config.docusignWebApp}/#/forms/exportview/${req.body.form_data}`;
            console.log('exportFormUrl',exportFormUrl);
            // const browser = await puppeteer.launch({args: ['--no-sandbox','--disable-setuid-sandbox']});
            const browser = await puppeteer.launch({args: ['--no-sandbox','--disable-setuid-sandbox']});
            console.log('browser launch');
            const page = await browser.newPage();
            console.log('page created ',page);
            await page.goto(exportFormUrl,{
                waitUntil: 'networkidle0',
                timeout: 0
            });
            console.log('page open');
            await page.waitFor(10000);
            await page.setViewport({
                width: 1680,
                height: 1050
            });
            console.log('returning pdf');
            const pdf = await page.pdf();
            await browser.close();
            return pdf;
        }
        catch(err) {
            console.log(err)
            return res.send(responseWrapper.getResponse(err,{},-9998,req));
        }
    }

    async function pushStreamToS3(request,readableStream,res) {
        try {
            const bucketName = await util.getS3BucketName();
            const prefixPath = await util.getS3PrefixPath(request.body);
            console.log('pushing to s3',prefixPath);
            const s3UploadUrlObj = await util.uploadReadableStreamToS3(request,{
                Bucket: bucketName,
                Key: `${prefixPath}/` + Date.now() + '.pdf',
                Body: readableStream,
                ContentType: 'application/pdf',
                ACL: 'public-read'
            },readableStream);
            return s3UploadUrlObj.Location
        } catch(err) {
            console.log(err)
            return res.send(responseWrapper.getResponse(err,{},-9998,request));
        }
    }

    async function putTimelineEntry(req,res,pdfUrl) {
        const {
            organization_id,
            account_id,
            workforce_id,
            asset_id,
            activity_type_category_id,
            activity_type_id,
            activity_id,
        } = req.body;

        const currentDate = new Date();
        const currentDateInDateTimeFormat = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");
        const epoch = moment().valueOf();
        var payload = {
            content: pdfUrl,
            subject: 'Forms data has been exported to pdf',
            mail_body: pdfUrl,
            attachments: [],
            activity_reference: [{
                activity_title: "",
                activity_id: ""
            }],
            asset_reference: [{}],
            form_approval_field_reference: []
        };
        const params = {
            organization_id,
            account_id,
            workforce_id,
            asset_id,
            activity_type_category_id,
            activity_type_id,
            activity_id,
            activity_stream_type_id: 723,
            activity_timeline_collection: JSON.stringify(payload),
            data_entity_inline: JSON.stringify(payload),
            datetime_log: currentDateInDateTimeFormat,
            timeline_transaction_datetime: currentDateInDateTimeFormat,
            track_gps_datetime: currentDateInDateTimeFormat,
            device_os_id: 7,
            message_unique_id: epoch,
        };

        return await activityTimelineService.addTimelineTransactionAsync(params);
    }

}
