var extern = window.extern || $sf.ext;
var hostSupports = {};
var adState = "ready";

function status_update(status, data)
{
	if(status == "expanded") {
		adState = "ready"
	var geo = extern.geom();
		// Expanded
	} else if (status == "collapsed") {
		adState = "ready"
		// Collapsed
	}	else if (status == "geom-update") {
		// update viewability
	} else if (status == "write-cookie") {
		// Cookies was written
		settingCookie = false;
	} else if (status == "read-cookie") {
		// verify that we're calling the right callback for the right event...
		if(fetchingCookie) fetchingCookie(data);
		else writeLog("Didn't execute.");
		fetchingCookie = false;
	} else if (status == "failed" && data.cmd == "write-cookie") {
		// Cookie write failed...  Should probably do something
		settingCookie = false;
	} else if (status == "failed" && data.cmd == "read-cookie") {
		// Cookie read failed...  What to do?
		fetchingCookie = false;
	}
}


function getEl(id){
	return document.getElementById(id);
}

function expandAd(){
	var ad = getEl('expandedAd');
	ad.style.display='inline-block';

	var dim = {
		r: 850,
		t: 0,
		b: 750,
		push: false
	};
	
	extern.expand(dim);
}
function collapseAd(){
	var ad = getEl('expandedAd');
	ad.style.display='none';
	extern.collapse();
}


if (extern) {
	try {
		var h = 1050;
		var w = 300;
		extern.register(w, h, status_update);
	} catch (e) {
		writeLog("Exception or no safeframes available: " + e.message);
	}
	
	// Query Support
	hostSupports['exp-ovr'] = false;
	hostSupports['exp-push'] = false;
	hostSupports['read-cookie'] = false;
	hostSupports['write-cookie'] = false;
	
	try { 
		hostSupports['exp-ovr'] = extern.supports("exp-ovr");
		hostSupports['exp-push'] = extern.supports("exp-push");
		hostSupports['read-cookie'] = extern.supports("read-cookie");
		hostSupports['write-cookie'] = extern.supports("write-cookie");
	} catch(e) {
		writeLog("Error testing host feature support.");
	}
}