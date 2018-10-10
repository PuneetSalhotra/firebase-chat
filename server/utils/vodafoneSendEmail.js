// 

function vodafoneSendEmail(request, objectCollection, customerCollection, callback) {

    console.log("\x1b[35m [Log] Inside vodafoneSendEmail \x1b[0m")

    const util = objectCollection.util;
    const db = objectCollection.db;

    let fieldHTML = '',
        nameStr = customerCollection.firstName,
        emailSubject = '',
        callToction;

    const jsonString = {
        asset_id: Number(customerCollection.customerServiceDeskAssetID),
        activity_id: Number(request.activity_id),
        type: 'approval'
    }

    if (String(customerCollection.contactEmailId).includes('%40')) {
        customerCollection.contactEmailId = String(customerCollection.contactEmailId).replace(/%40/g, "@");
    }

    const encodedString = Buffer.from(JSON.stringify(jsonString)).toString('base64');

    const baseUrlApprove = "https://preprodmydesk.desker.co/#/customapproval/" + encodedString;
    const baseUrlUpload = "https://preprodmydesk.desker.co/#/customupload/" + encodedString;

    if (Number(request.activity_form_id) === 837) {

        emailSubject = 'Upload Documents for Order';
        callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlUpload + "'>UPLOAD DOCUMENTS</a>"

    } else if (Number(request.activity_form_id) === 844) {

        emailSubject = "Approve Order Data";
        callToction = "<a style='background: #ED212C; display: inline-block; color: #FFFFFF; border-top: 10px solid #ED212C; border-bottom: 10px solid #ED212C; border-left: 20px solid #ED212C; border-right: 20px solid #ED212C; text-decoration: none; font-size: 12px; margin-top: 1.0em; border-radius: 3px 3px 3px 3px; background-clip: padding-box;' target='_blank' class='blue-btn' href='" + baseUrlApprove + "'>APPROVE</a>"

    }

    const formData = JSON.parse(request.activity_inline_data);

    formData.forEach(formEntry => {

        switch (Number(formEntry.field_data_type_category_id)) {
            case 8:
                /// Only Label
                fieldHTML += "<table style='width: 100%;margin-top:5px; '><tr><td style='width: 100%;padding: 5px 5px 5px 10px;font-size: 10px;'>";
                fieldHTML += unescape(formEntry.field_name);
                fieldHTML += "</td></tr>  </table>";
                break;

            default:
                fieldHTML += "<table style='width: 100%;margin-top:5px; '><tr><td style='width: 100%;border: 1px solid #cbcbcb;padding: 5px 5px 5px 10px;background: #e3e3e3;font-size: 10px;'>";
                fieldHTML += unescape(formEntry.field_name);
                fieldHTML += "</td></tr> <tr><td style='border: 1px solid #cbcbcb;border-top: 0px;padding: 5px 5px 5px 10px;font-size: 12px;'>";
                fieldHTML += unescape(formEntry.field_value);
                fieldHTML += "</td></tr> </table>";
                break;
        }
    });

    console.log("\x1b[35m [vodafoneSendEmail] fieldHTML: \x1b[0m", fieldHTML)
    const allFields = fieldHTML;

    const templateDesign = "<table style='border-collapse: collapse !important;' width='100%' bgcolor='#ffffff' border='0' cellpadding='10' cellspacing='0'><tbody><tr> <td> <table bgcolor='#ffffff' style='width: 100%;max-width: 600px;' class='content' align='center' cellpadding='0' cellspacing='0' border='0'> <tbody><tr><td align='center' valign='top'><table style='border: 1px solid #e2e2e2; border-radius: 4px; background-clip: padding-box; border-spacing: 0;' border='0' cellpadding='0' cellspacing='0' width='100%' id='templateContainer'><tbody> <tr> <td align='left' style='float: right;padding: 20px;' valign='top'> <img style='width: 100px' src ='https://office.desker.co/Vodafone_logo.png'/> <img style='height: 44px;margin-left: 10px;' src ='https://office.desker.co/Idea_logo.png'/> </td> </tr> <tr><td valign='top' style=' color: #505050; font-family: Helvetica; font-size: 14px; line-height: 150%; padding-top: 3.143em; padding-right: 3.5em; padding-left: 3.5em; padding-bottom: 3.143em; text-align: left;' class='bodyContent' mc:edit='body_content'> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>Hey " + nameStr + ",</p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 15px; margin-left: 0; text-align: left;'>Please verify the below form details.</p> <p style=' color: #808080; display: block; font-family: Helvetica; font-size: 14px; line-height: 1.500em; font-style: normal; font-weight: bold; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 10px; margin-left: 0; text-align: left;'>Order Management Form</p> " + allFields + "<table style='width: 100%;margin-top: 5px'></table> " + callToction + " <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 40px; margin-right: 0; margin-bottom: 0px; margin-left: 0; text-align: left;'> Parmeshwar Reddy </p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Vice President </p> <p style=' color: #ED212C; display: block; font-family: Helvetica; font-size: 12px; line-height: 1.500em; font-style: normal; font-weight: normal; letter-spacing: normal; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0; text-align: left;'> Customer Care </p></td></tr> <tr> <td style='height: 35px;background: #cbcbcb;'></td> </tr></tbody></table><!-- // END BODY --></td></tr> </tbody></table> </td> </tr></tbody></table>";

    util.sendEmailV2(request,
        customerCollection.contactEmailId,
        emailSubject,
        "IGNORE",
        templateDesign,
        (err, data) => {
            if (err) {
                console.log("[Send Email On Form Submission | Error]: ", data);
            } else {
                console.log("[Send Email On Form Submission | Response]: ", "Email Sent");
            }

            callback()
        });

}

module.exports = vodafoneSendEmail;
