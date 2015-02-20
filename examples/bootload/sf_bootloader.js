/*
* Copyright (c) 2014-2015, Interactive Advertising Bureau
* All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
"use strict";
(function(win) {
	// Root location of the SafeFrame framework. Modify for your distribution
	var FRAMEWORK_ROOT = '//s3-us-west-2.amazonaws.com/safeframe/refimpl/1-1-1/'; //js/lib/base.js

	// If you minimize the source, modify the HOST_FILES array to specify your pub-side file
	// and the RENDER_FILE to your custom r.html file
	var HOST_FILES = [
			FRAMEWORK_ROOT + 'js/lib/base.js',
			FRAMEWORK_ROOT + 'js/host/host.js',
			FRAMEWORK_ROOT + 'js/lib/boot.js'
			],
		RENDER_FILE = FRAMEWORK_ROOT + 'html/r.html';
	
	var win = win || window,
		doc = win.document;
	
	var thisScript = null,
		thisScriptSrc = null,
		adSpec = {},
		positions = [];
	
	// Stages of the bootloader execution
	var eventstages = {
		scriptInjected: false,
		bootloaded : false,
		configured : false,
		rendered: false
	};

	/**
	* Utility Functions
	*/
	var Utils = {
	
		makeEl : function (tag, attrs){
			var i, el;
			
			el = doc.createElement(tag);
			if(attrs && attrs.length > 0 && attrs.length % 2 == 0){
				for(i=0; i < attrs.length; i=i+2){
					el.setAttribute(attrs[i], attrs[i+1]);
				}
			}
			return el;
		},
        mixin: function (objA, objB) {
            var key;

            if (objA == null) {
                return objB;
            }
            if (objB == null) {
                return objB;
            }

            for (key in objB) {
                if (objB.hasOwnProperty(key)) {
                    objA[key] = objB[key];
                }
            }

            return objA;
        },
		
		rand: function() { return Math.round(Math.random()*100); },
		
		attachEvt: function (elem, event, cb){
			var ael = 'addEventListener',
				ae = 'attachEvent';
			if(elem[ael]){
				elem[ael](event, cb);
			}
			else if(elem[ae]){
				elem[ae]('on'+event, cb);
			}
		},
		
		/**
		* Dynamically load a script into the DOM
		*/
		loadScript: function (src){
			var head = doc.head,
				script = Utils.makeEl('script', ['src', src]);
			head.appendChild(script);		
		},
		/**
		* Return parameters in query or fragment as a key value hash
		*/
		getParameterHash: function(url){
			var posA = url.indexOf('?'),
				posB = url.indexOf('#'),
				data = {},
				i, bits, parts, val,
				str, start;
			
			if(posA == -1 && posB == -1){
				return data;
			}
			if(posA == -1 || posB == -1){
				start = Math.max(posA, posB);
			}
			else{
				start = Math.min(posA, posB);	
			}
			
			str = url.substring(start+1).replace(/[\?#]/g, '&');
            parts = str.split("&");
            for (i = 0; i < parts.length; i++) {
                bits = parts[i].split("=");
				if(bits.length > 2){
					val = bits.slice(1).join('=');
				}
				else{
					val = bits[1];
				}
                if (bits.length > 1) {
                    data[bits[0].toLowerCase()] = decodeURIComponent(val);
                }
            }
            return data;		
		}		
	}
	
	
	/**
	* Inject framework scripts
	*/	
	function injectScripts (){
		var i;
		for(i=0; i < HOST_FILES.length; i++){
			Utils.loadScript(HOST_FILES[i]);
		}
		eventstages.scriptInjected = true;
	}	
	
	
	function renderPositions(){
		var params = Utils.getParameterHash(thisScriptSrc),
			adConfig,
			targEl,
			markup,
			targetId;
		
		adConfig = {
			w : params.w,
			h : params.h,
			dest: params.target || null
		}
		
		markup = '<scr' + 'ipt type="text/javascript" src="' + params.ad + '"></scr' +  'ipt>';
		
		var makeTarget = function(id){
			var par = thisScript.parentNode,
				id = id || 'sf-boot-node_' + Utils.rand();
			var el;
			el = Utils.makeEl('div', ['style', 'display:inline-block', 'id', id]);
			par.insertBefore(el, thisScript);
			return el;
		}
		
		if(adConfig.dest){
			targEl = doc.getElementById(adConfig.dest);
		}
		
		if(targEl == null){
			targEl = makeTarget(adConfig.dest);
			adConfig.dest = targEl.getAttribute('id');
		}
		
		var posConf = new $sf.host.PosConfig(adConfig);
		var pos = new $sf.host.Position(posConf, markup);
		
		$sf.host.render(pos);
		
	}
	
	function bootload(){
		var conf,
			hasSf = (win['$sf'] !== undefined && win['$sf'] != null),
			hasSfLoaded = (hasSf && win['$sf']['host'] != null);
		
		if(hasSfLoaded){
			// Framework already loaded
			eventstages.bootloaded = true;
			eventstages.configured = true;
			var conf = new $sf.host.Config({
				renderFile: RENDER_FILE,
				positions: {}
			});
		
			setTimeout(renderPositions, 2);
		}
		else{
			if(!hasSf || !eventstages.scriptInjected){
				injectScripts();
			}
			setTimeout(bootload, 2);
		}
	}

	function configLoadEvents(){
		var loadEvent = 'DOMContentLoaded';
		if(doc['addEventListener']){
			Utils.attachEvt(doc, loadEvent, bootload);
		}
		else{
			Utils.attachEvt(win, 'load', bootload);
		}
	}
	
	/**
	* Tracks down our current script to pull off query or fragment parameters
	*/
	function findThisScriptElem(){
		var scripts, src, i;
		
		if(thisScript != null){
			return thisScript;
		}
		if(doc['currentScript']){
			thisScript = doc['currentScript'];
			thisScriptSrc = thisScript.getAttribute('src');
		}
		else{
			scripts = document.getElementsByTagName('script');
			for(i = scripts.length -1; i >= 0; i--){
				src = scripts[i].getAttribute('src');
				if(src && src.indexOf('sf_bootloader') > -1){
					thisScript = scripts[i];
					thisScriptSrc = src;
				}
			}
		}
		
		return thisScript;
	}
	
	// Initialize function
	(function (){
		findThisScriptElem();
		configLoadEvents();
	})();

})(window);