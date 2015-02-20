var extern = window.extern || $sf.ext;
var settingCookie = false;
var fetchingCookie = false;
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

function collapseModule(id)
{
	if(adState != "ready")
		return;
	
	var geo = extern.geom();
	
	adState = "collapsing";
	var adModuleExp, adModuleCol;
	var base = document.getElementById("adBase");
	base.style.width = "300px";
	for(var i = 1; i < 4; i++) {
		adModuleExp = document.getElementById("adModule" + i + "Expansion");
		adModuleCol = document.getElementById("adModule" + i + "Collapsed");
		
		if(adModuleExp && adModuleCol) {
			adModuleExp.style.display = "none";
			//adModuleExp.onclick = null;
			adModuleCol.style.display = "block";
			adModuleCol.style.zIndex = 1;
		}
	}
	extern.collapse();
}

function expandModule(id)
{
	if(adState != "ready")
		return;
		
	adState = "expanding";
	var dim = {};
	var adModuleExp, adModuleCol;
	var base = document.getElementById("adBase");
	
	for(var i = 1; i < 4; i++) {
		adModuleExp = document.getElementById("adModule" + i + "Expansion");
		adModuleCol = document.getElementById("adModule" + i + "Collapsed");
		if(i == id) {
			if(adModuleExp && adModuleCol) {
				adModuleExp.style.display = "block";
				adModuleExp.style.zIndex = 3000;
				adModuleExp.style.padding = 0;
				//adModuleExp.onclick = "collapseModule(" + id + ")";
				adModuleCol.style.display = "block";
				adModuleCol.style.zIndex = 2;
			}
		} else {
			if(adModuleExp && adModuleCol) {
				adModuleExp.style.display = "none";
				adModuleCol.style.display = "block";
				adModuleCol.style.zIndex = 1;
			}
		}
	}
	
	// ?Check ext.geom for dimensions and locations of the container?
	var geo = extern.geom();
	
	if(id == 1)
	{
		dim.l = 343;				//l:437, r:1380, w:943  Frame:943x2100; sf_Align:643x1050; sf_pos_rel: 300x1050
		//dim.l = "343px";		//l:437, r:1380*, w:943  Frame:943x2100; sf_Align:643x1050; sf_pos_rel: 300x1050
		//dim.l = -343;					//l:780, r:1380*, w:600  Frame:600x2100; sf_Align:643x1050; sf_pos_rel: 300x1050
		//dim.l = "-343px";
		//dim.l = 0;
		//dim.l = 643;
		
		
		base.style.width = "643px";
		dim.push = false;
	} else {
		dim.l = 195;
		dim.r = 0;
		base.style.width = "435px";
		dim.push = false;
	}
	
	extern.expand(dim);
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