document.write('<div style="background:lightgreen;height:100%;">');
document.write('<div style="font-weight:bold;">Advertisement Bootstrap</div>');
document.write('<div id="viewInfo" style="font-weight:bold;color:blue;font-family:Arial;"></div>');
document.write('<div id="feedback" style="height:240px;background:#333;color:yellow;overflow:auto;" ></div>');
document.write('<input id="msgContents" type="text" /><br/>');
document.write('<button onclick="sendMessage()">Send Host Message</button>');
document.write('<button onclick="invokeSampleExtension()">Invoke Sample Extension</button>');
//for local testing use
document.write('<scr' + 'ipt src=\"../../tests/sample_ads/exampleAdvertiserScripts.js\" ></sc' + '' + 'ript>');
document.write('<scr' + 'ipt src=\"../../src/js/xtra/sample.js\" ></sc' + '' + 'ript>');

//document.write('<scr' + 'ipt src=\"http://www.example.com/iab/v1/tests/sample_ads/exampleAdvertiserScripts.js\" ></sc' + '' + 'ript>');
document.write('</div>');
