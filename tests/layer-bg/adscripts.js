
(function(){
var extern = window.extern || $sf.ext;

	function testSupports(){
		writeLog("start");
		//debugger;
		var obj = extern.supports();

		var key
		for (key in obj){
			if(obj.hasOwnProperty(key) && typeof(obj[key]) !== 'function'){
				writeLog(key + " is " + obj[key]);
			}
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

	function loadBackground(){
		var bgObj = {};
		bgObj['color'] = 'red';
		//bgObj['imgsrc'] = 'http://localhost:9099/tests/layer-bg/carad-bg-image.jpg'
		bgObj['left_pane'] = {
			imgsrc : 'http://localhost:9099/tests/layer-bg/carad-bg-image.jpg'
		}
		bgObj['right_pane'] = {
			imgsrc : 'http://localhost:9099/tests/layer-bg/carad-bg-image.jpg',
			r: 0
		}
		
		extern.bg(bgObj);
	}
	
	function writeLog(message){
		//debugger;
		console.log(message);
	}


	if (extern) {
		try {
			extern.register(970, 66, status_update);
			testSupports();
			loadBackground();
		} catch (e) {
			writeLog("Exception or no safeframes available: " + e.message);
		}
	}

})();
