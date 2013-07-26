var img = "http://safeframes.emination.com/adfiles/backupImage.png"
// var img = "../../examples/IAB_RisingStars/Billboard_adfiles/backupImage.png";

var html =  "<!-- THIS IS EMBEDDED AS scripted content -->\n<style>\n#showAdButton{\n display: none;\n cursor: pointer;\n text-decoration: underline;\n text-align: right;\n width:970px;\n color: #888;\n font-weight:bold;\n font-size:0.8em;\n font-family: Verdana;\n}\n</style>\n\n<div id=\"showAdButton\" onclick=\"expandAd()\">Show ad <img src=\"http://safeframes.emination.com/adfiles/downarrow.png\" /></div>\n\n"
html += "<img src=\"" + img + "\"\n id=\"adImage\"\n usemap=\"admap\"\n style=\"width:970px;height:250px;\" />\n\n\n\n<map name=\"admap\">\n  <area shape=\"rect\" coords=\"850,5,965,30\" href=\"javascript:collapseAd()\" alt=\"Close\" onclick=\"collapseAd()\">\n</map>\n<!--\n<scr"+"ipt src=\"\"../../examples/IAB_RisingStars/Billboard_adfiles/adScriptBehavior.js\"></scr"+"ipt>\n-->\n\n<scr"+"ipt src=\"http://safeframes.emination.com/adfiles/adScriptBehavior.js\"></scr"+"ipt>\n"



document.write(html);
