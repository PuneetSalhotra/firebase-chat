var hummus = require("hummus");
var pdfReader = require("pdfreader");
const { ToWords } = require("to-words");

function pdfreplaceText(
  sourceFile,
  targetFile,
  pageNumber,
  findText,
  replaceText
) {
  console.log("in", pageNumber, findText, replaceText);
  //   var pdfParser = hummus.createReader(require("./test.pdf"));
  //   var digitalForm = new PDFDigitalForm(pdfParser);
  //   console.log(digitalForm);
  var fs = require("fs");
  fs.readFile(sourceFile, (err, pdfBuffer) => {
    // pdfBuffer contains the file content
    new pdfReader.PdfReader().parseBuffer(pdfBuffer, function (err, item) {
      if (err) callback(err);
      else if (!item) callback();
      else if (item.text) console.log(item.text);
    });
  });
  var writer = hummus.createWriterToModify(sourceFile, {
    modifiedFilePath: targetFile,
  });
  var sourceParser = writer
    .createPDFCopyingContextForModifiedFile()
    .getSourceDocumentParser();

  var pageObject = sourceParser.parsePage(Number(pageNumber));
  var textObjectId = pageObject
    .getDictionary()
    .toJSObject()
    .Contents.getObjectID();
  var textStream = sourceParser.queryDictionaryObject(
    pageObject.getDictionary(),
    "Contents"
  );
  console.log("textStream", textStream);
  //read the original block of text data
  var data = [];
  var readStream = sourceParser.startReadingFromStream(textStream);
  while (readStream.notEnded()) {
    Array.prototype.push.apply(data, readStream.read(10000));
  }
  //   console.log(findText)
  var string = Buffer.from(data).toString();
  for (let i = 0; i < findText.length; i++) {
    var characters = findText;
    var match = [];
    for (var a = 0; a < characters.length; a++) {
      match.push("(-?[0-9]+)?(\\()?" + characters[a] + "(\\))?");
    }
    //   console.log("---",match)
    string = string.replace(new RegExp(match.join("")), function (m, m1) {
      // m1 holds the first item which is a space
      return m1 + "( " + replaceText + ")";
    });
  }

  //Create and write our new text object
  var objectsContext = writer.getObjectsContext();
  objectsContext.startModifiedIndirectObject(textObjectId);

  var stream = objectsContext.startUnfilteredPDFStream();
  stream.getWriteStream().write(pdfstrToByteArray(string));
  objectsContext.endPDFStream(stream);

  objectsContext.endIndirectObject();
  function pdfstrToByteArray(str) {
    var myBuffer = [];
    var buffer = Buffer.from(str);
    for (var i = 0; i < buffer.length; i++) {
      myBuffer.push(buffer[i]);
    }
    return myBuffer;
  }

  writer.end();
}

var a = [
  "",
  "one ",
  "two ",
  "three ",
  "four ",
  "five ",
  "six ",
  "seven ",
  "eight ",
  "nine ",
  "ten ",
  "eleven ",
  "twelve ",
  "thirteen ",
  "fourteen ",
  "fifteen ",
  "sixteen ",
  "seventeen ",
  "eighteen ",
  "nineteen ",
];
var b = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function InWords(num) {
  if ((num = num.toString()).length > 9) return "overflow";
  n = ("000000000" + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  var str = num.split(".")[0];
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "crore "
      : "";
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "lakh "
      : "";
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "thousand "
      : "";
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "hundred "
      : "";
  str +=
    n[5] != 0
      ? (str != "" ? "and " : "") +
        (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) +
        "only "
      : "";

  return str;
}

const toWords = new ToWords();

// try {
//   pdfreplaceText(
//     "./test.pdf",
//     "./test1.pdf",
//     0,
//     "Student Profile",
//     "akjdvhaskjvhakjvkasjh"
//   );
// } catch (e) {
//   console.log(e);
// }

// var hummus = require('hummus');

/**
 * Returns a byteArray string
 *
 * @param {string} str - input string
 */
function strToByteArray(str) {
  var myBuffer = [];
  var buffer = new Buffer(str);
  for (var i = 0; i < buffer.length; i++) {
    myBuffer.push(buffer[i]);
  }
  return myBuffer;
}

function replaceText(
  sourceFile,
  targetFile,
  pageNumber,
  findText,
  replaceText
) {
  var writer = hummus.createWriterToModify(sourceFile, {
    modifiedFilePath: targetFile,
  });
  var sourceParser = writer
    .createPDFCopyingContextForModifiedFile()
    .getSourceDocumentParser();
  var pageObject = sourceParser.parsePage(pageNumber);
  var textObjectId = pageObject
    .getDictionary()
    .toJSObject()
    .Contents.getObjectID();
  var textStream = sourceParser.queryDictionaryObject(
    pageObject.getDictionary(),
    "Contents"
  );
  //read the original block of text data
  var data = [];
  var readStream = sourceParser.startReadingFromStream(textStream);
  while (readStream.notEnded()) {
    Array.prototype.push.apply(data, readStream.read(10000));
  }
  var string = String(
    new Buffer(data).toString().replace(findText, replaceText)
  );
  var objectsContext = writer.getObjectsContext();
  objectsContext.startModifiedIndirectObject(textObjectId);
  var stream = objectsContext.startUnfilteredPDFStream();
  stream.getWriteStream().write(strToByteArray(string));
  objectsContext.endPDFStream(stream);
  objectsContext.endIndirectObject();
  writer.end();
}

let data = {
  company_name: "OKAY CALL CENTRE PVT LTD",
  company_address: "FE 362 SALTLAKE SECTOR III KOLKATA 700106",
  email: "vijaykumar@pronteff.com",
  billing_address1: "Constantia,Dr. U.N.Brahmachari Street,Minto Park,",
  billing_address2: "Circus Avenue,Kolkata,Westbengal-700017",
  shipping_address1: "Constantia,Dr. U.N.Brahmachari Street,Minto Park,",
  shipping_address2: "Circus Avenue,Kolkata,Westbengal-700017",
  get_no: "19AAACB2100P1ZU",
  billing_address: "VODAFONE IDEA LIMITED - IN84",
  shipping_address: "VODAFONE IDEA LIMITED - IN84",
  billing_address3: "Kolkata,700017",
  billing_address4: "West Bengal",
  shipping_address3: "Kolkata,700017",
  shipping_address4: "West Bengal",
  state: "West Bengal",
  state_code: "19",
  gst_no: "19AAACB2100P1ZU",
  place_of_supply: "West Bengal",
  pan: "AAACB2100P",
  vender_code: "300072306",
  hsn_code: "9985",
  invoice_number: "30007230611201",
  invoice_date: "11-NOV-2020",
  item_price: "27,437.00",
  total_tax_amount: "4,938.66",
  total_taxable_invoice_value: "27,437.00",
  amount: "32,375.66",
  SGST: "2469.33",
  CGST: "2469.33",
  hsn_description: " Other Support services",
  amount_in_words: toWords.convert(parseFloat("32,375.66".replace(",", "")), {
    currency: true,
  }),
  month_validity: " Apr to Jun 20",
  vendor_GST: "19AABCO1271B1ZV",
  vendor_pan: "AABCO1271B",
  phone: "9874878113",
};

function Rs(amount) {
  var words = new Array();
  words[0] = "Zero";
  words[1] = "One";
  words[2] = "Two";
  words[3] = "Three";
  words[4] = "Four";
  words[5] = "Five";
  words[6] = "Six";
  words[7] = "Seven";
  words[8] = "Eight";
  words[9] = "Nine";
  words[10] = "Ten";
  words[11] = "Eleven";
  words[12] = "Twelve";
  words[13] = "Thirteen";
  words[14] = "Fourteen";
  words[15] = "Fifteen";
  words[16] = "Sixteen";
  words[17] = "Seventeen";
  words[18] = "Eighteen";
  words[19] = "Nineteen";
  words[20] = "Twenty";
  words[30] = "Thirty";
  words[40] = "Forty";
  words[50] = "Fifty";
  words[60] = "Sixty";
  words[70] = "Seventy";
  words[80] = "Eighty";
  words[90] = "Ninety";
  var op;
  amount = amount.toString();
  var atemp = amount.split(".");
  var number = atemp[0].split(",").join("");
  var n_length = number.length;
  var words_string = "";
  if (n_length <= 11) {
    var n_array = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0);
    var received_n_array = new Array();
    for (var i = 0; i < n_length; i++) {
      received_n_array[i] = number.substr(i, 1);
    }
    for (var i = 9 - n_length, j = 0; i < 9; i++, j++) {
      n_array[i] = received_n_array[j];
    }
    for (var i = 0, j = 1; i < 9; i++, j++) {
      if (i == 0 || i == 2 || i == 4 || i == 7) {
        if (n_array[i] == 1) {
          n_array[j] = 10 + parseInt(n_array[j]);
          n_array[i] = 0;
        }
      }
    }
    value = "";
    for (var i = 0; i < 9; i++) {
      if (i == 0 || i == 2 || i == 4 || i == 7) {
        value = n_array[i] * 10;
      } else {
        value = n_array[i];
      }
      if (value != 0) {
        words_string += words[value] + " ";
      }
      if (
        (i == 1 && value != 0) ||
        (i == 0 && value != 0 && n_array[i + 1] == 0)
      ) {
        words_string += "Crores ";
      }
      if (
        (i == 3 && value != 0) ||
        (i == 2 && value != 0 && n_array[i + 1] == 0)
      ) {
        words_string += "Lakhs ";
      }
      if (
        (i == 5 && value != 0) ||
        (i == 4 && value != 0 && n_array[i + 1] == 0)
      ) {
        words_string += "Thousand ";
      }
      if (i == 6 && value != 0 && n_array[i + 1] != 0 && n_array[i + 2] != 0) {
        words_string += "Hundred and ";
      } else if (i == 6 && value != 0) {
        words_string += "Hundred ";
      }
    }
    words_string = words_string.split(" ").join(" ");
  }
  return words_string;
}
function RsPaise(n) {
  nums = n.toString().split(".");
  var whole = Rs(nums[0]);
  if (nums[1] == null) nums[1] = 0;
  if (nums[1].length == 1) nums[1] = nums[1] + "0";
  if (nums[1].length > 2) {
    nums[1] = nums[1].substring(2, length - 1);
  }
  if (nums.length == 2) {
    if (nums[0] <= 1) {
      nums[0] = nums[0] * 10;
    } else {
      nums[0] = nums[0];
    }
    var fraction = Rs(nums[1]);
    if (whole == "" && fraction == "") {
      op = "Zero only";
    }
    if (whole == "" && fraction != "") {
      op = "paise " + fraction + " only";
    }
    if (whole != "" && fraction == "") {
      op = whole + "Rupees " + " only";
    }
    if (whole != "" && fraction != "") {
      op = whole + "Rupees " + "and " + fraction + "paise only";
    }
    amt = n;
    // if (amt > 99999999999.99) {
    //   op = "Oops!!! The amount is too big to convert";
    // }
    if (isNaN(amt) == true) {
      op = "Error : Amount in number appears to be incorrect. Please Check.";
    }
    return op;
  }
}

const HTMLTemplate = (data) => {
  let {
    company_address,
    company_name,
    email,
    phone,
    billing_address,
    billing_address1,
    billing_address2,
    billing_address3,
    billing_address4,
    shipping_address,
    shipping_address1,
    shipping_address2,
    shipping_address3,
    shipping_address4,
    state,
    state_code,
    gst_no,
    place_of_supply,
    pan,
    vender_code,
    hsn_code,
    invoice_number,
    invoice_date,
    item_price,
    total_tax_amount,
    total_taxable_invoice_value,
    amount,
    SGST,
    CGST,
    amount_in_words,
    month_validity,
    vendor_GST,
    vendor_pan,
    hsn_description,
  } = data;
  return `<html>
<head><meta http-equiv=Content-Type content="text/html; charset=UTF-8">
<style type="text/css">
span.cls_002{font-family:Arial,serif;font-size:10.1px;color:red;font-weight: bold !important;;font-style:normal;text-decoration: none}
div.cls_002{font-family:Arial,serif;font-size:10.1px;color:rgb(0,0,0);font-weight:bold;font-style:normal;text-decoration: none}
span.cls_004{font-family:Arial,serif;font-size:10.1px;color:rgb(0,0,0);font-weight:normal;font-style:normal;text-decoration: none}
div.cls_004{font-family:Arial,serif;font-size:10.1px;color:rgb(0,0,0);font-weight:normal;font-style:normal;text-decoration: none}
span.cls_005{font-family:Arial,serif;font-size:10.1px;color:rgb(119,119,119);font-weight:bold;font-style:normal;text-decoration: none}
div.cls_005{font-family:Arial,serif;font-size:10.1px;color:rgb(119,119,119);font-weight:bold;font-style:normal;text-decoration: none}
span.cls_006{font-family:Arial,serif;font-size:9.1px;color:rgb(17,17,17);font-weight:bold;font-style:normal;text-decoration: none}
div.cls_006{font-family:Arial,serif;font-size:9.1px;color:rgb(17,17,17);font-weight:bold;font-style:normal;text-decoration: none}
span.cls_007{font-family:Arial,serif;font-size:10.1px;color:rgb(70,70,70);font-weight:normal;font-style:normal;text-decoration: none}
div.cls_007{font-family:Arial,serif;font-size:10.1px;color:rgb(70,70,70);font-weight:normal;font-style:normal;text-decoration: none}
span.cls_008{font-family:Arial,serif;font-size:10.1px;color:rgb(70,70,70);font-weight:bold;font-style:normal;text-decoration: none}
div.cls_008{font-family:Arial,serif;font-size:10.1px;color:rgb(70,70,70);font-weight:bold;font-style:normal;text-decoration: none}
span.cls_003{font-family:Arial,serif;font-size:10.1px;color:rgb(119,119,119);font-weight:normal;font-style:normal;text-decoration: none}
div.cls_003{font-family:Arial,serif;font-size:10.1px;color:rgb(119,119,119);font-weight:normal;font-style:normal;text-decoration: none}
span.cls_009{font-family:Arial,serif;font-size:9.1px;color:rgb(119,119,119);font-weight:normal;font-style:normal;text-decoration: none}
div.cls_009{font-family:Arial,serif;font-size:9.1px;color:rgb(119,119,119);font-weight:normal;font-style:normal;text-decoration: none}

</style>
<script>
</script>
</head>
<body>
<div style="position:absolute;left:50%;margin-left:-299px;top:0px;width:595px;height:836px;border-style:outset;overflow:hidden">
<div style="position:absolute;left:0px;top:0px">
<img src="${__dirname}/background1.jpg"  width="595" height="837" style="z-index:10" >
<div style="position:absolute;left:228.54px;top:27.00px;" class="cls_002"><span class="cls_002">${company_name}</span></div>
<div style="position:absolute;left:191.52px;top:44.51px" class="cls_004"><span class="cls_004">${company_address}</span></div>
<div style="position:absolute;left:172.20px;top:56.51px" class="cls_004"><span class="cls_004">Contact :${phone}, Email: ${email}</span></div>
<div style="position:absolute;left:213.12px;top:75.50px" class="cls_002"><span class="cls_002">Tax Invoice - Original for recipient</span></div>
<div style="position:absolute;left:135.97px;top:91.75px" class="cls_005"><span class="cls_005">Bill To Address:</span></div>
<div style="position:absolute;left:387.54px;top:91.75px" class="cls_005"><span class="cls_005">Ship To Address:</span></div>
<div style="position:absolute;left:51.52px;top:107.26px" class="cls_006"><span class="cls_006">${billing_address}</span></div>
<div style="position:absolute;left:306.27px;top:107.26px" class="cls_006"><span class="cls_006">${shipping_address}</span></div>
<div style="position:absolute;left:51.52px;top:118.06px" class="cls_007"><span class="cls_007">${billing_address1}</span></div>
<div style="position:absolute;left:306.27px;top:118.06px" class="cls_007"><span class="cls_007">${shipping_address1}</span></div>
<div style="position:absolute;left:51.52px;top:130.06px" class="cls_007"><span class="cls_007">${billing_address2}</span></div>
<div style="position:absolute;left:306.27px;top:130.06px" class="cls_007"><span class="cls_007">${shipping_address2}</span></div>
<div style="position:absolute;left:51.52px;top:142.06px" class="cls_007"><span class="cls_007">${billing_address3}</span></div>
<div style="position:absolute;left:306.27px;top:142.06px" class="cls_007"><span class="cls_007">${shipping_address3}</span></div>
<div style="position:absolute;left:51.52px;top:154.06px" class="cls_007"><span class="cls_007">${billing_address4}</span></div>
<div style="position:absolute;left:306.27px;top:154.06px" class="cls_007"><span class="cls_007">${shipping_address4}</span></div>
<div style="position:absolute;left:51.52px;top:169.56px" class="cls_007"><span class="cls_007">State: ${state},</span></div>
<div style="position:absolute;left:51.52px;top:181.56px" class="cls_007"><span class="cls_007">State Code: ${state_code}</span></div>
<div style="position:absolute;left:51.52px;top:193.55px" class="cls_008"><span class="cls_008">GST/UIN Number: ${gst_no}</span></div>
<div style="position:absolute;left:51.52px;top:205.56px" class="cls_007"><span class="cls_007">Place of Supply: ${place_of_supply}</span></div>
<div style="position:absolute;left:51.52px;top:217.56px" class="cls_007"><span class="cls_007">PAN: ${pan}</span></div>
<div style="position:absolute;left:51.52px;top:248.55px" class="cls_005"><span class="cls_005">EVO Vendor Code:${vender_code}</span></div>
<div style="position:absolute;left:299.02px;top:248.56px" class="cls_007"><span class="cls_007">HSN Code:${hsn_code}</span></div>
<div style="position:absolute;left:51.52px;top:260.56px" class="cls_007"><span class="cls_007">Invoice Number: ${invoice_number}</span></div>
<div style="position:absolute;left:299.02px;top:260.56px" class="cls_007"><span class="cls_007">HSN Description: Other Support services</span></div>
<div style="position:absolute;left:51.52px;top:272.56px" class="cls_007"><span class="cls_007">Invoice Date:${invoice_date}</span></div>
<div style="position:absolute;left:299.02px;top:272.56px" class="cls_007"><span class="cls_007">PAN: ${vendor_pan}</span></div>
<div style="position:absolute;left:51.52px;top:284.56px" class="cls_007"><span class="cls_007">Invoice Period/Month :</span></div>
<div style="position:absolute;left:299.02px;top:284.56px" class="cls_007"><span class="cls_007">GST/UIN Number:${vendor_GST}</span></div>
<div style="position:absolute;left:239.31px;top:302.80px" class="cls_002"><span class="cls_002">Invoice for Commission</span></div>
<div style="position:absolute;left:47.02px;top:320.12px" class="cls_008"><span class="cls_008">Particulars</span></div>
<div style="position:absolute;left:454.26px;top:320.12px" class="cls_008"><span class="cls_008">Amount</span></div>
<div style="position:absolute;left:65.77px;top:337.19px" class="cls_007"><span class="cls_007">Commission - FLD SAC Old policy - ${month_validity}</span></div>
<div style="position:absolute;left:503.11px;top:337.19px" class="cls_007"><span class="cls_007">${item_price}</span></div>
<div style="position:absolute;left:47.02px;top:370.75px" class="cls_008"><span class="cls_008">Total Taxable Invoice Value on which GST is Applicable</span></div>
<div style="position:absolute;left:503.11px;top:370.76px" class="cls_007"><span class="cls_007">${total_taxable_invoice_value}</span></div>
<div style="position:absolute;left:47.02px;top:387.83px" class="cls_007"><span class="cls_007">Add:CGST</span></div>
<div style="position:absolute;left:364.35px;top:387.83px" class="cls_007"><span class="cls_007">9.00%</span></div>
<div style="position:absolute;left:511.28px;top:387.83px" class="cls_007"><span class="cls_007">${CGST}</span></div>
<div style="position:absolute;left:47.02px;top:404.89px" class="cls_007"><span class="cls_007">Add:SGST/UTGST</span></div>
<div style="position:absolute;left:364.35px;top:404.89px" class="cls_007"><span class="cls_007">9.00%</span></div>
<div style="position:absolute;left:511.28px;top:404.89px" class="cls_007"><span class="cls_007">${SGST}</span></div>
<div style="position:absolute;left:303.79px;top:438.74px" class="cls_008"><span class="cls_008">Total Tax Amount</span></div>
<div style="position:absolute;left:508.83px;top:438.74px" class="cls_007"><span class="cls_007">${total_tax_amount}</span></div>
<div style="position:absolute;left:249.56px;top:455.80px" class="cls_008"><span class="cls_008">Grand Total(Including Taxes)</span></div>
<div style="position:absolute;left:503.11px;top:455.81px" class="cls_007"><span class="cls_007">${amount}</span></div>
<div style="position:absolute;left:47.02px;top:489.37px" class="cls_008"><span class="cls_008">Amount Payable in Words: ${amount_in_words.substr(
    0,
    78
  )}</span></div>
  <div style="position:absolute;left:47.02px;top:501.37px" class="cls_008"><span class="cls_008"> ${amount_in_words.substr(
    78
  )}</span></div>
<div style="position:absolute;left:47.02px;top:518.15px" class="cls_008"><span class="cls_008">Terms and Conditions:</span></div>
<div style="position:absolute;left:47.02px;top:534.94px" class="cls_007"><span class="cls_007">No Tax is payable under reverse charge mechanism</span></div>
<div style="position:absolute;left:47.02px;top:551.73px" class="cls_007"><span class="cls_007">I/We hereby declare that,GST charged on this invoice shall be declared in our GSTR1 against the VBSL GSTIN</span></div>
<div style="position:absolute;left:47.02px;top:563.73px" class="cls_007"><span class="cls_007">and GST reimbursement claimed by me in all the previous month's has also been considered in respective</span></div>
<div style="position:absolute;left:47.02px;top:575.73px" class="cls_007"><span class="cls_007">month's GSTR1. If any liability arises to VBSL by way of disallowance of credit claimed on the invoice raised</span></div>
<div style="position:absolute;left:47.02px;top:587.73px" class="cls_007"><span class="cls_007">by me.I shall be responsible to reimburse the amount to VBSL along with Interest & Penalty.</span></div>
<div style="position:absolute;left:47.02px;top:604.89px" class="cls_007"><span class="cls_007">I/We declare that this invoice shows the actual Basic Commission & claw back and that all particulars are</span></div>
<div style="position:absolute;left:47.02px;top:616.89px" class="cls_007"><span class="cls_007">true and correct.</span></div>
<div style="position:absolute;left:395.81px;top:650.64px" class="cls_007"><span class="cls_007">${company_name}</span></div>
<div style="position:absolute;left:451.31px;top:683.64px" class="cls_007"><span class="cls_007">Authorized Signatory</span></div>
<div style="position:absolute;left:42.52px;top:725.62px" class="cls_003"><span class="cls_003">This invoice has been digitally signed for and on behalf</span></div>
<div style="position:absolute;left:42.52px;top:738.62px" class="cls_003"><span class="cls_003">of ${company_name} based on the E-</span></div>
<div style="position:absolute;left:42.52px;top:751.62px" class="cls_003"><span class="cls_003">authorisation received from ${company_name}.</span></div>

<div style="position:absolute;left:506.55px;top:803.49px" class="cls_009"><span class="cls_009">Page 1 of 1</span></div>
</div>

</body>
</html>
`;
};
const fs = require("fs");
fs.writeFile("./template.html", HTMLTemplate(data), (buffer) =>
  console.log(buffer)
);
const pdf = require("html-pdf");
var options = { base: "file://" + __dirname, format: "A4" };
pdf
  .create(HTMLTemplate(data), options)
  .toFile("./output.pdf", function (err, res) {
    if (err) return console.log(err);
    console.log(res); // { filename: '/app/businesscard.pdf' }
  });
