var extern = window.extern || $sf.ext;
var sfAPI = extern;

	function writeLog(message){
		//debugger;
		var el = document.getElementById("feedback");
		el.innerHTML += message + "<br />";
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

	function getViewableAmount(){
		var geom = extern.geom();
		var iv = geom.self.iv;
		iv = new Number(iv);
		var totalViewable = iv * 100;
		writeLog("Percent in view: " + totalViewable + "%");
	}

	
	function sendCrosstalk(){
		var xtalk = $sf.ext.xtra['crosstalk'];
		
		if(!xtalk){
			writeLog('Extension not defined');
			return;
		}
	
		var elem = document.getElementById("msgContents");
		if(!elem) return;
		
		var val = elem.value || "hello world";
	
		xtalk.broadcast(val);
	}

(function(){
	

})();	



