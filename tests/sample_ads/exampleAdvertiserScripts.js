var extern = window.extern || $sf.ext;
var sfAPI = extern;

	function writeLog(message){
		//debugger;
		var el = document.getElementById("feedback");
		el.innerHTML += message + "<br />";
	}


		/**
		 * Attach an event handler to a DOM node
		 * Normalizes event attachment across browsers.
		 *
		 * @param {Element|string} element DOM Element reference or element ID
		 * @param {string} event Event name (without "on" prefix). ex: "click"
		 * @param {Function} eventHandler Function to attach to event handler
		 *
		*/
		function attachEvent(element, event, eventHandler){
			if(element === undefined || element === null
				|| eventHandler === undefined || eventHandler === null
				|| event == undefined || event === null){
				return;
			}
			if(typeof(element) === 'string'){
				element = document.getElementById(element);
			}
			if(typeof(eventHandler) !== 'function'){
				if(typeof(eventHandler) === 'string'){
					var func = window[eventHandler];
					if(!func){
						return;
					}
					else if(typeof(func) === 'function'){
						eventHandler = func;
					}
					else{
						return;
					}
				}
			}
			if(!element){
				return;
			}
			if(element.addEventListener){
				element.addEventListener(event, eventHandler, false);
			}
			else if(element.attachEvent){
				element.attachEvent('on' + event, eventHandler);
			}
		}

	function collapseAd(){
		extern.collapse();
	}
	
	function adStatus(){
		var result = extern.status();
		writeLog(result);
	}
	
	function testSupports(){
		writeLog("start");
		//debugger;
		var obj = extern.supports();

		var key
		for (key in obj){
			writeLog(key + " is " + obj[key]);
		}
	}
	
	function getHostUrl(){
		writeLog(document.referrer);
	}

	function testGeometry(){
		writeLog("=====================");
		writeLog("start geom");
		//debugger;
		var geom = extern.geom();
		if(geom == null){
			writeLog("Geometry missing");
		}
		else{
			for (key in geom){
				writeLog(key + " is " + geom[key]);
			}
		}
	}
	
	function updateInViewDisplay(){
		var totalViewable = extern.inViewPercentage();

		var elem = document.getElementById("viewInfo");
		elem.innerHTML = "Viewable: " + totalViewable + "%";
	}


	function status_update(status, data)
	{
	//debugger;
		if(status == "expanded"){
		} 
		else if (status == "geom-update") {
			updateInViewDisplay();
		}
		else if (status == "read-cookie") {
			writeLog("Read Cookie: " + data.value);
		}
		else if (status == "write-cookie") {
			writeLog("Wrote Cookie: " + data.value);
		}
		
		
	}

	if (extern) {
		try {
			extern.register(160, 650, status_update);
		} catch (e) {
			writeLog("Exception or no safeframes available: " + e.message);
		}
	}

	function expandAd(){
		var w = window, sf = w["sf"], e = sf && sf.ext, g, ex;

		writeLog("Ad expand on load - collapse in 4 seconds");

		if (extern) {
			try {
				g	= extern.geom();
				ex	= g && g.exp;
				//if (Math.abs(ex.l) >= 400 && Math.abs(ex.t) >= 200) {
						extern.expand(400, 200); //{l:400,t:200}
				//}
			} catch (e) {
				//do not expand, not enough room
			}
		} else {
			//api expansion not supported
		}
//		writeLog("Old expand " + extern.status());

	}

	function getViewableAmount(){
		var geom = extern.geom();
		var iv = geom.self.iv;
		iv = new Number(iv);
		var totalViewable = iv * 100;
		writeLog("Percent in view: " + totalViewable + "%");
	}

	window.cookName = "foo";

	function tryReadHostCookie(){
		var e;
			if (extern.supports("read-cookie")) {
				extern.cookie("foo");
				writeLog("attempted read-cookie");
			}
			else {
				writeLog("read-cookie not supported");
			}
			
	/*
		try {
		} catch (e) {
			fetchingCookie = false;
		}
	*/
	}

	
	function tryWriteHostCookie(){
		var e; 
		var cookieData = {value:"Hello World"};
		
		try {
			if (sfAPI && sfAPI.supports("write-cookie")) {
				settingCookie = sfAPI.cookie("foo", cookieData);
				writeLog("attempt write-cookie: " + "foo");
			}
			else {
				writeLog("write-cookie not supported");
			}
		} catch (e) {
			settingCookie = false;
		}
	}
	
	function sendMessage(){
		var elem = document.getElementById("msgContents");
		if(!elem) return;
		
		var val = elem.value || "hello world";
	
		sfAPI.message(val);
	}

(function(){
	updateInViewDisplay();
})();

(function(){
	
	expandAd();
	
	window.setTimeout(function(){
		collapseAd();
		}, 4000);
})();	



