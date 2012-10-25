var extern = window.extern || $sf.ext;

	function testSupports(){
		writeLog("start");
		//debugger;
		var obj = extern.supports();

		var key
		for (key in obj){
			writeLog(key + " is " + obj[key]);
		}
	}

	function testGeometry(){
		writeLog("=====================");
		writeLog("start geom");
		//debugger;
		var geom = extern.geom(), buffer = [], obj, typ, propKey;
		if(geom == null) {
			writeLog("Geometry missing");
		} else {
			for (key in geom) {
				obj = geom[key];
				typ = typeof obj;
				if (typ == "object") {
					propKey = "";
					buffer.push(key, ": ");
					for (propKey in obj)
					{
						if (typeof obj[propKey] == "function") continue;
						buffer.push(propKey, " is ", obj[propKey], ", ");
					}
					buffer.length -= 1;
					buffer.push("<br />");
				} else if (typ == "function") {
					continue;
				} else {
					buffer.push(key, " is ", obj, "<br />");
				}
			}
			writeLog(buffer.join(""));
		}
	}


	function status_update(status, cmd)
	{
		writeLog("status");
		writeLog(status);
		if(status == "expanded"){
			expanded = true;
		} else if (status == "geom-update") {
			windowGeometry();
		}


		adStatus();

	}

	if (extern) {
		try {
			extern.register(400, 350, status_update);

			writeLog(extern.meta("context"));
			//read some meta data passed in from the publisher side
		} catch (e) {
			writeLog("Exception or no safeframes available: " + e.message);
		}
	}



	function windowGeometry(){
		writeLog("=====================");
		writeLog("start geom");
		//debugger;
		var geom = extern.geom();
		if(geom == null){
			writeLog("Geometry missing");
		}
		else{
			writeLog("Window Dimensions:");
			writeLog("width: " + geom.win.w + ", height: " + geom.win.h);
		}
	}

	function expandAd(){
		var w = window, sf = w["$sf"], extern = sf && sf.ext, g, ex, l, r;

		writeLog("Status before :" + extern.status());

		if (extern) {
			try {
				g	= extern.geom();
				ex	= g && g.exp;
				l	= Math.abs(ex.l);
				r	= Math.abs(ex.r);

				if (l && l >= 100) {
					extern.expand({t:50,b:200,l:50,r:50});

				} else if (r && r >= 100) {
					extern.expand(100, 200);
				} else {
					writeLog("didn't expand not enough room");
				}
			} catch (e) {
				//failure
			}
		} else {
			//api expansion not supported
		}
		writeLog("Status after :" + extern.status());

	}

	function collapseAd(){
		var w = window, sf = w["$sf"], extern = sf && sf.ext, g, ex;
					extern.collapse();
	}

	function adStatus(){
		writeLog("sf.extern.status(): " + extern.status());
	}

	function externMeta(){
		// writeLog("sf.extern.status(): " + extern.status());
		try{
			var sectionID	= $sf.ext.meta("sectionID", "rmx");
			writeLog("rmx meta: " + sectionID);
		}
		catch(ex){}

		writeLog("check foometa");
		var fm = $sf.ext.meta("foometa");
		if(fm == null){
			writeLog("foometa came up null");
		}
		else{
			writeLog(fm);
		}

	}
	function showMyUrl(){
		// URLs with variable replacement are usually processed by the server
		// We are hacking to expose them.
		var scripts = document.getElementsByTagName("script");
		var myScript = scripts[scripts.length - 2];
		writeLog(myScript.src);
	}

	function getHostUrl(){
		var url = extern.hostURL();
		writeLog("Host URL: " + url);
	}

	function getViewableAmount(){
		var geom = extern.geom();
		var iv = geom.self.iv;
		iv = new Number(iv);
		var totalViewable = iv * 100;
		writeLog("Percent in view: " + totalViewable + "%");
	}


	function writeLog(message){
		//debugger;
		var el = document.getElementById("feedback");
		el.innerHTML += message + "<br />";
	}

	function clearLog()
	{
		var el = document.getElementById("feedback");
		el.innerHTML = "";
	}

