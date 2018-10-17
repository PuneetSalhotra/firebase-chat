const moment = require('moment');
const aws = require('aws-sdk');
aws.config.loadFromPath(`${__dirname}/configS3.json`);

const s3 = new aws.S3();

const PdfPrinter = require('pdfmake/src/printer');
const fonts = {
    Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
    }
};
const printer = new PdfPrinter(fonts);
const fs = require('fs');

// tableIndex
var tableIndex;

// PDF Document Definition
var pdfDocumentDefinition = {
    content: [{
            text: 'Aryan Autoagencies Pvt Ltd.',
            style: 'header'
        },
        {
            text: 'Customer Information',
            style: 'subheader'
        },
        {
            style: 'tableExample',
            table: {
                widths: [200, 400],
                heights: [30, 30, 30, 30],
                body: [
                    ['Name', ''],
                    ['Address', ''],
                    ['Contact Number', ''],
                    ['Email', '']
                ]
            }
        },
        {
            text: 'Proforma Invoice',
            style: 'subheader'
        },
        {
            style: 'tableExample',
            table: {
                widths: [200, 400],
                heights: [30, 30, 30, 30, 30],
                body: [
                    ['Executive Name', ''],
                    ['Executive Contact Number', ''],
                    ['Date', ''],
                    ['Invoice Number', ''],
                    ['GSTIN Number', '']
                ]
            }
        },
        {
            text: '\n\n\n\n\n'
        },
        {
            style: 'tableExample',
            table: {
                heights: [20, 30, 30, 30, 30, 30, 30, 30, 30, 30],
                widths: [100, 100, 100, 100, 100, 100, 100],
                body: [
                    ['Models', 'ACCESS125-DRUM', 'ACCESS125-DISC', 'ACCSPL DISC', 'HAYATE', 'GIXXER 155', 'INTRUDER 155'],
                    ['Particulars', '', '', '', '', '', ''],
                    ['Ex Showroom Price', '', '', '', '', '', ''],
                    ['Life Time Tax', '', '', '', '', '', ''],
                    ['Comprehensive Insurance', '', '', '', '', '', ''],
                    ['Registration Charges', '', '', '', '', '', ''],
                    ['Smart Card/Postal Charges', '', '', '', '', '', ''],
                    ['Number Plate with Painting', '', '', '', '', '', ''],
                    ['Extended Warranty', '', '', '', '', '', ''],
                    ['On Road Price', '', '', '', '', '', ''],

                ]
            }
        },
        {
            text: 'Note: Price, Specification, Equipment and Tax are subject to change without notice and those prevailing at the time of delivery will only apply.',
            style: 'regular'
        },
        {
            text: 'For Aryan Autoagencies Pvt Ltd.',
            style: 'authorisedSignatory'
        },
        {
            text: '\n\n\n'
        },
        {
            text: '(Authorised Signatory)',
            style: 'authorisedSignatory'
        },

    ],
    styles: {
        header: {
            fontSize: 18,
            // bold: true,
            margin: [0, 0, 0, 10],
            alignment: 'center'
        },
        subheader: {
            fontSize: 16,
            // bold: true,
            margin: [0, 10, 0, 5]
        },
        tableExample: {
            fontSize: 11,
            margin: [0, 5, 0, 15]
        },
        authorisedSignatory: {
            fontSize: 14,
            margin: [0, 10, 0, 5]
        }
    },
    pageOrientation: 'landscape',
};

var a = pdfDocumentDefinition;

function generatePdfAndUpload(request, form_id, formSubmissionData, activityFormDataInDB, callback) {

    const pdfFilePath = `pdfs/${request.activity_parent_id}.pdf`;

    console.log("form_id: ", form_id);
    // console.log("formSubmissionData: ", formSubmissionData);

    if (activityFormDataInDB === null || activityFormDataInDB === '' || activityFormDataInDB === '{}') {
        // pdfDocumentDefinition = formSubmissionData;
        console.log("1");
    } else {
        console.log("2");
        pdfDocumentDefinition = JSON.parse(activityFormDataInDB);
    }

    // Determine the main table's index
    // 
    if (Number(form_id) === 815) {
        // Proforma Invoice - ACCESS125-DRUM
        tableIndex = 1;
    } else if (Number(form_id) === 816) {
        // Proforma Invoice - ACCESS125-DISC
        tableIndex = 2;
    } else if (Number(form_id) === 817) {
        // Proforma Invoice - ACCSPL DISC
        tableIndex = 3;
    } else if (Number(form_id) === 818) {
        // Proforma Invoice - HAYATE
        tableIndex = 4;
    } else if (Number(form_id) === 819) {
        // Proforma Invoice - GIXXER 155
        tableIndex = 5;
    } else if (Number(form_id) === 820) {
        // Proforma Invoice - INTRUDER 155
        tableIndex = 6;
    }

    // On the road price initialization
    var onTheRoadPrice = 0;

    // Loop through each field in the submitted form and update the values
    // 
    formSubmissionData.forEach(formEntry => {
        // console.log(formEntry.field_name, " : ", typeof formEntry.field_id);
        switch (formEntry.field_id) {
            case 4780: // 815 => Mr./Mrs./Ms.
            case 4792: // 816 => Mr./Mrs./Ms.
            case 4804: // 817 => Mr./Mrs./Ms.
            case 4816: // 818 => Mr./Mrs./Ms.
            case 4828: // 819 => Mr./Mrs./Ms.
            case 4841: // 820 => Mr./Mrs./Ms.
                pdfDocumentDefinition.content[2].table.body[0][1] = request.contact_reference_name;
                break;

            case 4781: // 815 => Address
            case 4793: // 816 => Address
            case 4805: // 817 => Address
            case 4817: // 818 => Address
            case 4829: // 819 => Address
            case 4840: // 820 => Address
                pdfDocumentDefinition.content[2].table.body[1][1] = request.contact_reference_address;
                break;

            case 4782: // 815 => Contact Number
            case 4794: // 816 => Contact Number
            case 4806: // 817 => Contact Number
            case 4818: // 818 => Contact Number
            case 4830: // 819 => Contact Number
            case 4842: // 820 => Contact Number
                pdfDocumentDefinition.content[2].table.body[2][1] = request.contact_reference_contact_number;
                break;

                // Main Table
            case 4783: // 815 => Ex Showroom Price
            case 4795: // 816 => Ex Showroom Price
            case 4807: // 817 => Ex Showroom Price
            case 4819: // 818 => Ex Showroom Price
            case 4831: // 819 => Ex Showroom Price
            case 4843: // 820 => Ex Showroom Price
                pdfDocumentDefinition.content[6].table.body[2][tableIndex] = formEntry.field_value;
                onTheRoadPrice += Number(formEntry.field_value);
                break;

            case 4784: // 815 => Life Time Tax
            case 4796: // 816 => Life Time Tax
            case 4808: // 817 => Life Time Tax
            case 4820: // 818 => Life Time Tax
            case 4832: // 819 => Life Time Tax
            case 4844: // 820 => Life Time Tax
                pdfDocumentDefinition.content[6].table.body[3][tableIndex] = formEntry.field_value;
                onTheRoadPrice += Number(formEntry.field_value);
                break;

            case 4785: // 815 => Comprehensive Insurance
            case 4797: // 816 => Comprehensive Insurance
            case 4809: // 817 => Comprehensive Insurance
            case 4821: // 818 => Comprehensive Insurance
            case 4833: // 819 => Comprehensive Insurance
            case 4845: // 820 => Comprehensive Insurance
                pdfDocumentDefinition.content[6].table.body[4][tableIndex] = formEntry.field_value;
                onTheRoadPrice += Number(formEntry.field_value);
                break;

            case 4786: // 815 => Registration Charges
            case 4798: // 816 => Registration Charges
            case 4810: // 817 => Registration Charges
            case 4822: // 818 => Registration Charges
            case 4834: // 819 => Registration Charges
            case 4846: // 820 => Registration Charges
                pdfDocumentDefinition.content[6].table.body[5][tableIndex] = formEntry.field_value;
                onTheRoadPrice += Number(formEntry.field_value);
                break;

            case 4787: // 815 => Smart Card/Postal Charges
            case 4799: // 816 => Smart Card/Postal Charges
            case 4811: // 817 => Smart Card/Postal Charges
            case 4823: // 818 => Smart Card/Postal Charges
            case 4835: // 819 => Smart Card/Postal Charges
            case 4847: // 820 => Smart Card/Postal Charges
                pdfDocumentDefinition.content[6].table.body[6][tableIndex] = formEntry.field_value;
                onTheRoadPrice += Number(formEntry.field_value);
                break;

            case 4788: // 815 => Number Plate with Painting
            case 4800: // 816 => Number Plate with Painting
            case 4812: // 817 => Number Plate with Painting
            case 4824: // 818 => Number Plate with Painting
            case 4836: // 819 => Number Plate with Painting
            case 4848: // 820 => Number Plate with Painting
                pdfDocumentDefinition.content[6].table.body[7][tableIndex] = formEntry.field_value;
                onTheRoadPrice += Number(formEntry.field_value);
                break;

            case 4789: // 815 => Extended Warranty
            case 4801: // 816 => Extended Warranty
            case 4813: // 817 => Extended Warranty
            case 4825: // 818 => Extended Warranty
            case 4837: // 819 => Extended Warranty
            case 4849: // 820 => Extended Warranty
                pdfDocumentDefinition.content[6].table.body[8][tableIndex] = formEntry.field_value;
                onTheRoadPrice += Number(formEntry.field_value);
                break;

            case 4862: // 815 => Aurthorised Signatory
            case 4860: // 816 => Aurthorised Signatory
            case 4858: // 817 => Aurthorised Signatory
            case 4856: // 818 => Aurthorised Signatory
            case 4854: // 819 => Aurthorised Signatory
            case 4852: // 820 => Aurthorised Signatory
                // 
                break;

            case 4913: // 815 => Contact Reference
            case 4965: // 816 => Contact Reference
            case 4963: // 817 => Contact Reference
            case 4964: // 818 => Contact Reference
            case 4962: // 819 => Contact Reference
            case 4961: // 820 => Contact Reference
                // 
                break;

        }
    });

    // Update Contact Reference's Email Field:
    pdfDocumentDefinition.content[2].table.body[3][1] = request.contact_reference_email || '-';

    // Update Executive's Details:
    pdfDocumentDefinition.content[4].table.body[0][1] = request.contact_executive_name || '-';
    pdfDocumentDefinition.content[4].table.body[1][1] = request.contact_executive_contact_number || '-';
    pdfDocumentDefinition.content[4].table.body[2][1] = moment(request.invoice_date).utcOffset("+05:30").format('YYYY-MM-DD HH:mm:ss') || '-';
    pdfDocumentDefinition.content[4].table.body[3][1] = request.activity_parent_id || '-';
    pdfDocumentDefinition.content[4].table.body[4][1] = '29AAFCA2076E1ZT';

    // Update on-the-road price:
    pdfDocumentDefinition.content[6].table.body[9][tableIndex] = onTheRoadPrice;

    // Update activityFormDataInDB
    activityFormDataInDB = JSON.stringify(pdfDocumentDefinition);

    // Generate the PDF
    // 
    var pdfWriteStream = fs.createWriteStream(`pdfs/${request.activity_parent_id}.pdf`);
    var pdfDoc = printer.createPdfKitDocument(pdfDocumentDefinition);
    pdfDoc.pipe(pdfWriteStream);
    pdfDoc.end();

    // Upload file to S3
    pdfWriteStream.on('close', () => {
        var params = {
            Body: fs.createReadStream(pdfFilePath),
            Bucket: "desker-9166-20180126-11192367",
            Key: `${request.activity_parent_id}.pdf`,
            ContentType: 'application/pdf',
            //ContentEncoding: 'base64',
            ACL: 'public-read'
        };

        s3.putObject(params, function (err, data) {
            console.log(err);
            console.log(data);
        });
    })

    const s3BucketName = "desker-9166-20180126-11192367";
    const reportURL = `https://s3.amazonaws.com/${s3BucketName}/${request.activity_parent_id}.pdf`;

    callback(false, activityFormDataInDB, reportURL);
}

module.exports = generatePdfAndUpload;
