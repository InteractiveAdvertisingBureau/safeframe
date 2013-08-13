// var img = "../../examples/IAB_RisingStars/Billboard_adfiles/backupImage.png";

var img = "https://s3-us-west-2.amazonaws.com/safeframe/samples/rising_stars/billboard_adfiles/backupImage.png"
var scr = "https://s3-us-west-2.amazonaws.com/safeframe/samples/rising_stars/billboard_adfiles/adScriptBehavior.js"  // ../../examples/IAB_RisingStars/Billboard_adfiles/adScriptBehavior.js

var html =   "<!-- \nTHIS IS EMBEDDED AS scripted content .\nSource here is provided as a mechanism to make the ad more readable.\nActual source is translated into Javascript string and placed in \"billboardAdBootstrap.js\" file.\n-->\n<style>\n#showAdButton{\n display: none;\n cursor: pointer;\n text-decoration: underline;\n text-align: right;\n width:970px;\n color: #888;\n font-weight:bold;\n font-size:0.8em;\n font-family: Verdana;\n}\n</style>\n\n<scr"+"ipt>\nfunction preCollapse(){\n collapseAd();\n}\n</scr"+"ipt>\n\n<div id=\"showAdButton\" onclick=\"expandAd()\">Show ad <img src=\"https://s3-us-west-2.amazonaws.com/safeframe/samples/rising_stars/billboard_adfiles/downarrow.png\" /></div>\n\n<a href=\"javascript:collapseAd();\" onclick=\"collapseAd();return false;\"><img src=\"https://s3-us-west-2.amazonaws.com/safeframe/samples/rising_stars/billboard_adfiles/backupImage.png\"\n id=\"adImage\"\n style=\"width:970px;height:250px;border:0;\" /></a>\n\n<scr"+"ipt src=\"https://s3-us-west-2.amazonaws.com/safeframe/samples/rising_stars/billboard_adfiles/adScriptBehavior.js\"></scr"+"ipt>\n"

document.write(html);
