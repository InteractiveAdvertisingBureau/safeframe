var extern = window.extern || $sf.ext;
var sfAPI = extern;
var adState // = "expanded";
var settingCookie = false;
var fetchingCookie = false;
var hostSupports = {};

 function writeLog(message){
  var el = document.getElementById("feedback");
  if(el) el.innerHTML += message + "<br />";
 }
 
function priorityLog(message) {
	var el = document.getElementById("feedback");
	if(el) el.innerHTML = message;
}

function getPropsAsString(obj) {
	var s = "";
	for (var prop in obj) {
	  if (typeof obj[prop] != 'function') {
		s = s + ((s.length>0)? "," : "") + prop
	  }
	}
	return s;
}
	
function examineObject(obj) {
	var funcs = [];
	var fields = [];
	for (var prop in obj) {
		if(typeof obj[prop] != 'function') {
			fields.push(prop + "[" + typeof obj[prop] + "] : " + obj[prop]);
		} else {
			funcs.push(prop + "()");
			// grab arity?
		}
	}
	return fields.join("</br>") + funcs.join("</br>");
}

 /*
 function status_update(status, data)
 {
  if(status == "expanded"){
  }
  else if (status == "geom-update") {
   // update viewability
  }
 }*/
 function status_update(status, data)
 {
	//writeLog(">" + status + examineObject(data));
	if(status == "expanded") {
		//priorityLog("Expanded!!");
		adState = "expanded";
		setCookie("flashBrandAdState","expanded",1);
	} else if (status == "collapsed") {
		//writeLog("Collapsed!!");
		adState = "collapsed";
		setCookie("flashBrandAdState","collapsed",1);
		setTimeout(function() { 
			writeLog("timeout"); 
			getCookie("flashBrandAdState", (function(cookieValue) {
					writeLog("flashBrandAdState: " + cookieValue);
				}));
		}, 100);
	}
	else if (status == "geom-update") {
		// update viewability
	} else if (status == "write-cookie") {
		// Cookies was written
		settingCookie = false;
	} else if (status == "read-cookie") {
		// verify that we're calling the right callback for the right event...
		//writeLog(typeof fetchingCookie);
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
 
/**
* set cookie contents for page display on return until midnight when execution changes
* Returns: True if cookie is being written, false if call failed
*/
function setCookie(ad_state,newValue,exdays)
{
	// Prevent multiple setCookie calls
	if(settingCookie || !hostSupports['write-cookie']) {
		writeLog("Gave up setting cookie");
		return false;	
	}
		
	var date = new Date();
	var midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
	var cookieData = (exdays==null)? {value:newValue,expires:midnight.toUTCString()} : 
		{value:newValue}; // No need to escape value?
	writeLog("Setting...");
	try {
		if (extern) {
			extern.cookie(ad_state, cookieData);
			settingCookie = true;
			return settingCookie;
		}
	} catch (e) {
		writeLog("Exception setting cookie");
		settingCookie = false;
	}
	return false;
}

/**
* get cookie from sfAPI.
* Returns: True if cookie is being fetched, false if call failed
*/
function getCookie(ad_state, handler)
{
	if(fetchingCookie || !hostSupports['read-cookie'])
		return false;
	
	try {
		if (extern) {
			extern.cookie(ad_state)
			fetchingCookie = handler;
			return true;
		}
	} catch (e) {
		fetchingCookie = false;
	}
	return false;
}


 /**
 * Expand the ad by calling the SafeFrame API
 */
 function expandAd(){
  var g, ex, obj;
	if ($sf.ext) {
		   try {
		var body = document.getElementsByTagName('body')[0];
		body.style.height='100%';
				  var expel = document.getElementById("collapsedAd");
				  if(expel){
					expel.style.display = "none";
				  }
				  var adimg = document.getElementById("expandedAd");
				  if(adimg){
					adimg.style.display = "block";
				  }
				g = $sf.ext.geom(); // the geometry object
				ex = g && g.exp;
				obj = {};
				if(window.adExpandedDim){
					obj.l=window.adExpandedDim.l || 0;
					obj.r=window.adExpandedDim.r || 970;
					obj.t=window.adExpandedDim.t || 0;
					obj.b=window.adExpandedDim.b || 250;
					obj.push= window.adExpandedDim.push || true;
				}
				else{
					obj.l=0;
					obj.r=970;
					obj.t=0;
					obj.b=250;
					obj.push=true;
				}
				//if (Math.abs(ex.l) >= expandedWidth && Math.abs(ex.t) >= expandedHeight) {
				$sf.ext.expand(obj);
				//priorityLog(getPropsAsString(obj) + extern.status());
			//}
		   } catch (e) {
			//do not expand, not enough room
		   }
	} 
	else {
	   //api expansion not supported
	}
 } 

 function collapseAd(){
  $sf.ext.collapse();
  window.setTimeout(function(){
	  var expel = document.getElementById("collapsedAd");
	  if(expel){
		expel.style.display = "block";
	  }
	  var adimg = document.getElementById("expandedAd");
	  if(adimg){
		adimg.style.display = "none";
	  }
  }, 500);
 }

 function checkStoredState()
 {
	var b = getCookie("flashBrandAdState", (function(cookieValue) {
		//writeLog("got: " + cookieValue);
		adState = cookieValue;
		if (adState == null || adState == "" || adState == "undefined")
			adState = "expanded";	//expanded by default
			
		if (adState == "expanded") {	
			var body = document.getElementsByTagName('body')[0];
			body.style.height='100%';
			expandAd();
		} else {
			var expel = document.getElementById("collapsedAd");
			if(expel){
				expel.style.display = "block";
			}
			var adimg = document.getElementById("expandedAd");
			if(adimg){
				adimg.style.display = "none";
			}
		}
		}));
	//writeLog("Read? " + b);
 }

 if (extern) {
	try {
		var h = 1;
		var w = 970;
		if(window.adCollapsedDim) {
			h = window.adCollapsedDim.h || 1;
			w = window.adCollapsedDim.w || 970;
		}
		extern.register(w, h, status_update);
	} catch (e) {
		writeLog("Exception or no safeframes available: " + e.message);
	}
	
	// Query Support
	hostSupports['exp-push'] = false;
	hostSupports['read-cookie'] = false;
	hostSupports['write-cookie'] = false;
	
	try { 
		hostSupports['exp-push'] = extern.supports("exp-push");
		hostSupports['read-cookie'] = extern.supports("read-cookie");
		hostSupports['write-cookie'] = extern.supports("write-cookie");
	} catch(e) {
		writeLog("Error testing host feature support.");
	}
 }

// Expand the ad on mouseover
(function(){
	//writeLog(examineObject(hostSupports));
		//expandAd(window.sampleAdDim);
		//var s = extern.status();
 checkStoredState();
 /*setTimeout(function(){
	// May not have returned...
	
	
	writeLog("At start:" + adState);
  
  
  body.addEventListener('mouseover', function(){
   expandAd();
  });
  body.addEventListener('mouseout', function(){
   collapseAd();
  });

 }, 10);
  */

})();
