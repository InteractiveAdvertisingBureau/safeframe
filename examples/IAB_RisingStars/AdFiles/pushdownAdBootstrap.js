// var img = "../../examples/IAB_RisingStars/adfiles/backupImage.png";

var img = "https://s3-us-west-2.amazonaws.com/safeframe/samples/rising_stars/adfiles/pushdown_expanded_ad.png"
var scr = "https://s3-us-west-2.amazonaws.com/safeframe/samples/rising_stars/adfiles/adScriptBehavior.js"  // ../../examples/IAB_RisingStars/Billboard_adfiles/adScriptBehavior.js

var html =   "<!-- \nTHIS IS EMBEDDED AS scripted content .\nSource here is provided as a mechanism to make the ad more readable.\nActual source is translated into Javascript string and placed in \"billboardAdBootstrap.js\" file.\n-->\n<style>\n#showAdButton{\n display: none;\n cursor: pointer;\n text-decoration: underline;\n text-align: right;\n width:970px;\n color: #888;\n font-weight:bold;\n font-size:0.8em;\n font-family: Verdana;\n}\n</style>\n\n<scr"+"ipt>\nwindow.sampleAdDim = {b: 415};\n</scr"+"ipt>\n\n<a href=\"javascript:collapseAd();\" onclick=\"collapseAd();return false;\"><img src=\"https://s3-us-west-2.amazonaws.com/safeframe/samples/rising_stars/adfiles/pushdown_expanded_ad.png\"\n id=\"adImage\"\n style=\"width:960px;height:415px;border:0;margin-left:auto;margin-right:auto\" /></a>\n\n<scr"+"ipt src=\"https://s3-us-west-2.amazonaws.com/safeframe/samples/rising_stars/adfiles/adScriptBehavior.js\"></scr"+"ipt>\n"

document.write(html);
