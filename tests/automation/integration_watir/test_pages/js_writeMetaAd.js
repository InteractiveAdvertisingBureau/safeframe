document.write('<div style="background:lightblue;">');
document.write('<input id="sharedMetaKey" style="width:65px;" value="key_foo" type="text" />');
document.write('<button class="ext_sharedmeta" onclick="testSharedMeta()">Shared Meta object</button><br/>');
document.write('<input id="privateMetaKey" style="width:65px;" value="myprivatekey" type="text" />');
document.write('<input id="privateSectionKey" style="width:65px;" value="sectionKey" type="text" />');
document.write('<button class="ext_privatemeta" onclick="testPrivateMeta()">Private Meta</button>');
document.write('<button class="clearBtn" onclick="clearLog()">Clear Log</button>');
document.write('</div>');
document.write('<div id="feedback" style="height:240px;background:#333;color:yellow;overflow:auto;" ></div>');
//for local testing use
document.write('<scr' + 'ipt src=\"/tests/automation/integration_watir/test_pages/metaActionScript.js\" ></sc' + '' + 'ript>');
document.write('</div>');

var rm_data = new Object();
rm_data.creative_id = 11409285;
rm_data.offer_type = 3;
rm_data.entity_id = 45574;
if (window.rm_crex_data) {rm_crex_data.push(11409285);}