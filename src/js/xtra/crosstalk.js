/**
* SafeFrame extension "crosstalk"
* This extension allows two or more ads to register for cross-communication.
*/

(function(w){
	var _knownAds = {},
		sf = w['$sf'], host = sf && sf.host;
	
	
	var _msgListener = function(sender, eventName, data){
		debugger;
		console.log(data);
	};

	var ctHost = {
		greet: function() { alert('hello host world') },
		
		init: function(config){
			debugger;
			var items = host.list(),
				i, key, pos;
			
			host.addListener('posmsg', _msgListener);
			
			for(i=0; i < items.length; i++){
				key = items[i];
				if(_knownAds[key] === undefined){
					pos = host.get(key);
					_knownAds[key] = pos && pos.config;
				}
			}		
		}
	};
	 
	var ctExt = {
	
		receivers: [],
		
		registerReceiver: function(listener, senders) {
			listeners.push({ func: listener, sender: senders});
		},
		
		/**
		* Send a message to other ads.
		* Payload should be a json object { message: {msg}, targets: [array] }
		*/
		send: function(payload){
			// message.stringify
			
		},
		
		broadcast: function(message){
			var ext = $sf.ext;
			var val = {type: 'crosstalk', message: message};
			ext.message(val);
		},
		
		init: function(config){
		debugger;
			alert('init in ext');
		}
	}

	$sf.xtra.register("crosstalk", { host: ctHost, ext: ctExt });
})(window);





