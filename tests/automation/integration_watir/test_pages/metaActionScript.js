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

	function testSharedMeta(showKeys){
		var key = getEl('sharedMetaKey').value || 'sf_ver';
		var val = $sf.ext.meta(key);
		
		if(showKeys){
			writeLog('shared meta ' + key + ': ' + val);
		}
		else{
			writeLog(val);
		}
	}

	function testPrivateMeta(showKeys){
		var ownerkey = getEl('privateMetaKey').value;
		var sec = getEl('privateSectionKey').value;
		var val = $sf.ext.meta(sec, ownerkey);
		
		if(showKeys){
			writeLog('private ' + ownerkey + ' sec ' + sec + ' : ' + val);
		}
		else{
			writeLog(val);
		}
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

