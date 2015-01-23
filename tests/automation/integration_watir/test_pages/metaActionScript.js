var extern = window.extern || $sf.ext;

function getEl(id){
	return document.getElementById(id);
}

	function status_update(status, cmd)
	{
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

	function adStatus(){
		console.log(extern.status());
	}

	function testSharedMeta(){
		var key = getEl('sharedMetaKey').value || 'sf_ver';
		var val = $sf.ext.meta(key);
		
		writeLog('shared meta ' + key + ': ' + val);
	}


	function writeLog(message){
		//debugger;
		console.log(message);
		
		var el = document.getElementById("feedback");
		el.innerHTML += message + "<br />";
	}

	function clearLog()
	{
		var el = document.getElementById("feedback");
		el.innerHTML = "";
	}

