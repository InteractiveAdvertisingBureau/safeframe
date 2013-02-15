document.write('<div style="background:lightgreen;height:100%;">');
document.write('<div style="font-weight:bold;">Advertisement Bootstrap</div>');
document.write('<div id="viewInfo" style="font-weight:bold;color:blue;font-family:Arial;"></div>');
document.write('<div id="feedback" style="height:240px;background:#333;color:yellow;overflow:auto;" ></div>');
document.write('<input id="msgContents" type="text" /><br/>');
document.write('<button onclick="sendMessage()">Send Host Message</button>');
document.write('<button onclick="testGeometry()">sf.ext.geom</button>');
document.write('<button onclick="expandAd()">sf.ext.expand</button>');
document.write('<button onclick="collapseAd()">sf.ext.collapse</button>');
document.write('<button onclick="adStatus()">sf.ext.status</button>');
document.write('<button onclick="tryReadHostCookie()">Read sf.ext.cookie</button>');
document.write('<button onclick="tryWriteHostCookie()">Write sf.ext.cookie</button>');
document.write('<button onclick="getViewableAmount()">percent_viewable</button>');
document.write('<button onclick="getHostUrl()">hostURL</button>');
//for local testing use
document.write('<scr' + 'ipt src=\"../../tests/sample_ads/exampleAdvertiserScripts.js\" ></sc' + '' + 'ript>');
//document.write('<scr' + 'ipt src=\"http://www.example.com/iab/v1/tests/sample_ads/exampleAdvertiserScripts.js\" ></sc' + '' + 'ript>');
document.write('</div>');
