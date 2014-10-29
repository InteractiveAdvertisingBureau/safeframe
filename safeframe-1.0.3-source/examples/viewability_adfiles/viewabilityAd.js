document.write('<div id="viewInfo" style="height:20px;font-weight:bold;color:blue;font-family:Arial;"></div>');
document.write('<div id="feedback" style="height:40px;background:#333;color:yellow;overflow:auto;" ></div>');
//document.write('<button onclick="testSupports()">sf.ext.supports</button>');
document.write('<button onclick="testGeometry()">sf.ext.geom</button>');
//document.write('<button onclick="windowGeometry()">window geom</button>');
document.write('<button onclick="getViewableAmount()">percent_viewable</button>');
document.write('</div>');

var extern = window.extern || $sf.ext;
var sfAPI = extern;

	function writeLog(message){
		//debugger;
		var el = document.getElementById("feedback");
		el.innerHTML += message + "<br />";
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
			extern.register(720, 90, status_update);
		} catch (e) {
			writeLog("Exception or no safeframes available: " + e.message);
		}
	}

	(function(){
		window.setTimeout(function(){
			updateInViewDisplay();
			}, 100);
	})();
	