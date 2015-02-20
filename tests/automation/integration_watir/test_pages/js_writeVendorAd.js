document.write('<div style="background:lightblue;height:450px;width:400px;">');
document.write('<button class="ext_supports" onclick="testSupports()">$sf.ext.supports</button>');
document.write('<button class="ext_geom" onclick="testGeometry()">$sf.ext.geom</button>');
document.write('<button onclick="windowGeometry()">window geom</button>');
document.write('<button class="ext_expand" onclick="expandAd()">$sf.ext.expand</button>');
document.write('<button class="ext_collapse" onclick="collapseAd()">$sf.ext.collapse</button>');
document.write('<button class="ext_status" onclick="adStatus()">$sf.ext.status</button>');
document.write('<button class="ext_meta" onclick="externMeta()">$sf.ext.meta</button>');
document.write('<button class="ext_inviewpercentage" onclick="getViewableAmount()">$sf.ext.inViewPercentage</button>');
document.write('<button onclick="getHostUrl()">$sf.ext.hostURL</button>');
document.write('<button onclick="showMyUrl()">My URL</button>');
document.write('<button class="clearBtn" onclick="clearLog()">Clear Log</button>');
document.write('<button class="exception_btn" onclick="throw(\"Error Forced\");" style="background:red;color:white;">THROW EXCEPTION</button>');
document.write('<div id="feedback" style="height:240px;background:#333;color:yellow;overflow:auto;" ></div>');
//for local testing use
document.write('<scr' + 'ipt src=\"/tests/automation/integration_watir/test_pages/vendorActionScript.js\" ></sc' + '' + 'ript>');
document.write('</div>');

var rm_data = new Object();
rm_data.creative_id = 11409285;
rm_data.offer_type = 3;
rm_data.entity_id = 45574;
if (window.rm_crex_data) {rm_crex_data.push(11409285);}