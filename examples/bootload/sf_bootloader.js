/*
* Copyright (c) 2012, Interactive Advertising Bureau
* All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
"use strict";
(function(win) {
	// Root location of the SafeFrame framework. Modify for your distribution
	var FRAMEWORK_ROOT = 'https://s3-us-west-2.amazonaws.com/safeframe/refimpl/1-0-3/'; //js/lib/base.js
	
	// If you minimize the source, modify the HOST_FILES array to specify your pub-side file
	// and the RENDER_FILE to your custom r.html file
	var HOST_FILES = [
			FRAMEWORK_ROOT + 'js/lib/base.js',
			FRAMEWORK_ROOT + 'js/host/host.js',
			FRAMEWORK_ROOT + 'js/lib/boot.js'
			],
		RENDER_FILE = FRAMEWORK_ROOT + 'html/r.html';
	
	// Stages of the bootloader execution
	var eventstages = {
		bootloaded : false,
		configured : false,
		rendered: false
	};
	
	function attachEvt(evt){
		if(
	} 
	
	
	
	function bootload(){
		if(win['$sf'] !== undefined && win['$sf'] != null){
			eventstages.bootloaded = true;
			eventstages.configured = true;
			
			setTimeout(renderPositions, 2);
		}	
	}

	function configLoadEvents(){
	
	
	}


})(window);